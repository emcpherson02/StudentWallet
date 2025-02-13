const { DatabaseError, NotFoundError, ValidationError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { validateCategory } = require('../utils/constants');

class TransactionService {
    constructor(transactionModel, budgetModel, budgetNotificationService) {
        this.transactionModel = transactionModel;
        this.budgetModel = budgetModel;
        this.budgetNotificationService = budgetNotificationService;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, category, date, description } = transactionData;

            const transaction = {
                Amount: amount,
                category,
                date: new Date(date).toISOString().split('T')[0],
                Description: description,
            };

            const createdTransaction = await this.transactionModel.create(userId, transaction);

            if (category) {
                const budgets = await this.budgetModel.findByCategory(userId, category);
                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const newSpent = (budget.spent || 0) + Number(amount);

                    await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                    await this.budgetModel.linkTransactionToBudget(userId, budget.id, createdTransaction.id);

                    // Check budget limit and send notification if needed
                    await this.budgetNotificationService.checkAndNotifyBudgetLimit(
                        userId,
                        category,
                        newSpent,
                        budget.amount
                    );
                }
            }

            return createdTransaction;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to add transaction');
        }
    }

    async getUserTransactions(userId) {
        try {
            const transactions = await this.transactionModel.findByUserId(userId);
            return transactions.map(doc => ({
                id: doc.id,
                type: doc.Description || doc.description,
                category: doc.category,
                amount: doc.Amount || doc.amount,
                date: doc.date,
                isPlaidTransaction: doc.isPlaidTransaction || false
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

    async getTransactionAnalytics(userId) {
        try {
            const transactions = await this.transactionModel.findByUserId(userId);

            // Calculate total spent
            const totalSpent = transactions.reduce((sum, transaction) =>
                sum + Math.abs(transaction.Amount || 0), 0);

            // Calculate average transaction
            const averageTransaction = transactions.length > 0 ?
                totalSpent / transactions.length : 0;

            // Calculate daily spending patterns with averages
            const dailySpending = transactions.reduce((acc, transaction) => {
                const day = new Date(transaction.date).getDay();
                if (!acc[day]) {
                    acc[day] = {
                        total: 0,
                        count: 0
                    };
                }
                acc[day].total += Math.abs(transaction.Amount || 0);
                acc[day].count += 1;
                return acc;
            }, {});

            // Format daily spending for all days of week
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dailySpendingPattern = days.map((day, index) => {
                const dayData = dailySpending[index] || { total: 0, count: 0 };
                const averageAmount = dayData.count > 0 ? dayData.total / dayData.count : 0;

                return {
                    day,
                    amount: averageAmount,
                    totalSpent: dayData.total,
                    transactionCount: dayData.count
                };
            });

            return {
                totalSpent,
                averageTransaction,
                totalTransactions: transactions.length,
                dailySpendingPattern
            };
        } catch (error) {
            throw new DatabaseError('Failed to get transaction analytics');
        }
    }

    async updateCategory(userId, transactionId, category, budgetId) {
        try {
            const transaction = await this.transactionModel.findById(userId, transactionId);
            if (!transaction) {
                throw new NotFoundError('Transaction not found');
            }
            console.log('Found transaction:', transaction);

            // Update transaction category
            const updatedTransaction = await this.transactionModel.update(userId, transactionId, {
                category,
                lastUpdated: new Date().toISOString()
            });
            console.log('Updated transaction:', updatedTransaction);

            // If there's a matching budget, link the transaction
            if (budgetId) {
                await this.budgetModel.linkTransactionToBudget(userId, budgetId, transactionId);

                // Update budget spent amount
                const budget = await this.budgetModel.findById(userId, budgetId);
                const newSpent = (budget.spent || 0) + Math.abs(transaction.Amount);
                await this.budgetModel.update(userId, budgetId, { spent: newSpent });

                // Check budget limit and send notification if needed
                await this.budgetNotificationService.checkAndNotifyBudgetLimit(
                    userId,
                    category,
                    newSpent,
                    budget.amount
                );
            }
            console.log('Linked transaction to budget:', budgetId);

            return updatedTransaction;
        } catch (error) {
            throw new DatabaseError('Failed to update transaction category');
        }
    }
}

module.exports = TransactionService;