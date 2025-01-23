const { DatabaseError, NotFoundError, ValidationError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { validateCategory } = require('../utils/constants');

class TransactionService {
    constructor(transactionModel, budgetModel, balanceService) {
        this.transactionModel = transactionModel;
        this.budgetModel = budgetModel;
        this.balanceService = balanceService;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, category, date, description, transactionType } = transactionData;

            const transaction = {
                Amount: amount,
                category,
                date: new Date(date).toISOString().split('T')[0],
                Description: description,
                type: transactionType
            };

            console.log('Creating transaction:', transaction); // Debug log

            const createdTransaction = await this.transactionModel.create(userId, transaction);

            console.log('Transaction created:', createdTransaction); // Debug log

            try {
                if (transactionType === 'expense') {
                    await this.balanceService.deductFromBalance(userId, Number(amount));
                } else {
                    await this.balanceService.addToBalance(userId, Number(amount));
                }
            } catch (balanceError) {
                console.error('Balance update error:', balanceError); // Debug log
                throw balanceError;
            }

            if (transactionType === 'expense' && category) {
                const budgets = await this.budgetModel.findByCategory(userId, category);
                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const newSpent = (budget.spent || 0) + Number(amount);
                    await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                    await this.budgetModel.linkTransactionToBudget(userId, budget.id, createdTransaction.id);
                }
            }

            return createdTransaction;
        } catch (error) {
            console.error('Transaction error:', error); // Debug log
            throw new DatabaseError('Failed to add transaction');
        }
    }

    async getUserTransactions(userId) {
        try {
            const transactions = await this.transactionModel.findByUserId(userId);
            return transactions.map(doc => ({
                id: doc.id,
                type: doc.Description,
                category: doc.category,
                amount: doc.Amount,
                date: doc.date,
            }));
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch transactions');
        }
    }

    async deleteTransaction(userId, transactionId) {
        try {
            console.log('Starting delete transaction:', { userId, transactionId });

            // Get the transaction first
            const transaction = await this.transactionModel.findById(userId, transactionId);
            if (!transaction) {
                throw new NotFoundError('Transaction not found');
            }

            // Update balance
            if (transaction.type === 'expense') {
                await this.balanceService.addToBalance(userId, Number(transaction.Amount));
            } else {
                await this.balanceService.deductFromBalance(userId, Number(transaction.Amount));
            }

            // Find budgets that have this transaction
            const budgets = await this.budgetModel.findByUserId(userId);

            // Go through each budget and check if it's tracking this transaction
            for (const budget of budgets) {
                if (budget.trackedTransactions && budget.trackedTransactions.includes(transactionId)) {
                    // If the budget category matches the transaction category, update spent amount
                    if (budget.category === transaction.category) {
                        const newSpent = (budget.spent || 0) - Number(transaction.Amount);
                        await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                    }

                    // Remove transaction from tracking
                    await this.budgetModel.removeTransactionTracking(userId, budget.id, transactionId);
                }
            }

            // Finally delete the transaction
            const deleted = await this.transactionModel.delete(userId, transactionId);
            if (!deleted) {
                throw new NotFoundError('Transaction not found');
            }

            return true;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete transaction');
        }
    }
}

module.exports = TransactionService;