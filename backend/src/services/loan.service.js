const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');

class LoanService {
    constructor(loanModel, transactionModel) {
        this.loanModel = loanModel;
        this.transactionModel = transactionModel;
    }

    async addLoan(userId, loanData) {
        try {
            const {
                instalmentDates,
                instalmentAmounts,
                livingOption,
                totalAmount
            } = loanData;

            // Validate required fields
            if (!instalmentDates || !instalmentAmounts || !livingOption || !totalAmount) {
                throw new ValidationError('Missing required fields');
            }

            // Validate instalments
            if (instalmentDates.length !== 3 || instalmentAmounts.length !== 3) {
                throw new ValidationError('Three instalments are required');
            }

            // Validate living option
            if (!['away', 'home'].includes(livingOption)) {
                throw new ValidationError('Invalid living option');
            }

            // Validate total amount matches instalments
            const totalInstalments = instalmentAmounts.reduce((sum, amount) => sum + amount, 0);
            if (totalInstalments !== totalAmount) {
                throw new ValidationError('Total amount must match sum of instalments');
            }

            const loan = await this.loanModel.create(userId, {
                instalmentDates,
                instalmentAmounts,
                livingOption,
                totalAmount,
                remainingAmount: totalAmount
            });

            return loan;
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            console.error('Error in addLoan:', error);
            throw new DatabaseError('Failed to add loan: ' + error.message);
        }
    }

    async getLoan(userId) {
        try {
            console.log('Getting loan for user:', userId);
            const loans = await this.loanModel.findByUserId(userId);
            console.log('Found loans:', loans);
            if (!loans || loans.length === 0) {
                console.log('No loans found for user');
                return null;
            }

            // Get transaction details for each tracked transaction
            const loan = loans[0];
            if (loan.trackedTransactions && loan.trackedTransactions.length > 0) {
                const transactions = [];
                for (const transactionId of loan.trackedTransactions) {
                    const transaction = await this.transactionModel.findById(userId, transactionId);
                    if (transaction) {
                        transactions.push(transaction);
                    }
                }
                loan.transactions = transactions;
            }

            return loan;
        } catch (error) {
            console.error('Error in getLoan:', error);
            throw new DatabaseError('Failed to get loan');
        }
    }

    async updateLoan(userId, loanId, updates) {
        try {
            console.log('Starting loan update:', { userId, loanId, updates });

            // Validate instalments if both amounts and total are provided
            if (updates.instalmentAmounts && updates.totalAmount) {
                const totalInstalments = updates.instalmentAmounts.reduce((sum, amount) => sum + amount, 0);
                console.log('Validating amounts:', { totalInstalments, totalAmount: updates.totalAmount });
                if (totalInstalments !== updates.totalAmount) {
                    throw new ValidationError('Total amount must match sum of instalments');
                }
            }

            if (updates.livingOption && !['away', 'home'].includes(updates.livingOption)) {
                throw new ValidationError('Invalid living option');
            }

            // Create a clean update object with only defined values
            const updateData = {};

            // Only include fields that are present in the updates
            if (updates.instalmentAmounts) updateData.instalmentAmounts = updates.instalmentAmounts;
            if (updates.instalmentDates) updateData.instalmentDates = updates.instalmentDates;
            if (updates.livingOption) updateData.livingOption = updates.livingOption;
            if (updates.totalAmount) updateData.totalAmount = updates.totalAmount;

            // Always add lastUpdated timestamp
            updateData.lastUpdated = new Date().toISOString();

            console.log('Updating loan with data:', updateData);
            const updated = await this.loanModel.update(userId, loanId, updateData);

            if (!updated) {
                throw new NotFoundError('Loan not found');
            }

            console.log('Loan updated successfully:', updated);
            return updated;
        } catch (error) {
            console.error('Error updating loan:', error);
            if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to update loan: ' + error.message);
        }
    }

    async deleteLoan(userId, loanId) {
        try {
            const deleted = await this.loanModel.delete(userId, loanId);
            if (!deleted) {
                throw new NotFoundError('Loan not found');
            }
            return true;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to delete loan');
        }
    }

    async linkAllTransactions(userId, loanId) {
        try {
            // Get the loan to verify it exists and check remaining amount
            const loan = await this.getLoan(userId);
            if (!loan) {
                throw new NotFoundError('Loan not found');
            }

            // Get all user transactions
            const transactions = await this.transactionModel.findByUserId(userId);
            if (!transactions || transactions.length === 0) {
                return { message: 'No transactions found to link' };
            }

            let totalLinkedAmount = 0;
            const linkedTransactions = [];

            // Link each transaction
            for (const transaction of transactions) {
                // Skip if the transaction would exceed remaining amount
                if (totalLinkedAmount + transaction.Amount > loan.remainingAmount) {
                    continue;
                }

                const linked = await this.loanModel.linkTransactionToLoan(
                    userId,
                    loanId,
                    transaction.id,
                    transaction.Amount
                );

                if (linked) {
                    totalLinkedAmount += transaction.Amount;
                    linkedTransactions.push(transaction.id);
                }
            }

            return {
                message: 'Transactions linked successfully',
                linkedTransactions: linkedTransactions.length,
                totalAmount: totalLinkedAmount
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to link transactions');
        }
    }

    async unlinkAllTransactions(userId, loanId) {
        try {
            // Get the loan to verify it exists and get tracked transactions
            const loan = await this.getLoan(userId);
            if (!loan) {
                throw new NotFoundError('Loan not found');
            }

            const trackedTransactions = loan.trackedTransactions || [];
            if (trackedTransactions.length === 0) {
                return { message: 'No transactions found to unlink' };
            }

            let totalUnlinkedAmount = 0;
            const unlinkedTransactions = [];

            // Unlink each transaction
            for (const transactionId of trackedTransactions) {
                const transaction = await this.transactionModel.findById(userId, transactionId);
                if (!transaction) continue;

                const removed = await this.loanModel.removeTransactionFromLoan(
                    userId,
                    loanId,
                    transactionId,
                    transaction.Amount
                );

                if (removed) {
                    totalUnlinkedAmount += transaction.Amount;
                    unlinkedTransactions.push(transactionId);
                }
            }

            return {
                message: 'Transactions unlinked successfully',
                unlinkedTransactions: unlinkedTransactions.length,
                totalAmount: totalUnlinkedAmount
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to unlink transactions');
        }
    }

    async linkSingleTransaction(userId, loanId, transactionId) {
        try {
            // Get the loan to verify it exists and check remaining amount
            const loan = await this.getLoan(userId);
            if (!loan) {
                throw new NotFoundError('Loan not found');
            }

            // Get the transaction
            const transaction = await this.transactionModel.findById(userId, transactionId);
            if (!transaction) {
                throw new NotFoundError('Transaction not found');
            }

            // Check if transaction is already linked
            if (loan.trackedTransactions && loan.trackedTransactions.includes(transactionId)) {
                throw new ValidationError('Transaction is already linked to this loan');
            }

            // Check if transaction amount would exceed remaining amount
            if (transaction.Amount > loan.remainingAmount) {
                throw new ValidationError('Transaction amount exceeds remaining loan amount');
            }

            // Link the transaction
            const linked = await this.loanModel.linkTransactionToLoan(
                userId,
                loanId,
                transactionId,
                transaction.Amount
            );

            if (!linked) {
                throw new DatabaseError('Failed to link transaction');
            }

            return {
                message: 'Transaction linked successfully',
                transactionId,
                amount: transaction.Amount
            };
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
            throw new DatabaseError('Failed to link transaction');
        }
    }
}

module.exports = LoanService;