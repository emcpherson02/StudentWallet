const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');
const { validateCategory } = require('../utils/constants');

class BudgetService {
    constructor(budgetModel, transactionModel, budgetNotificationService) {
        this.budgetModel = budgetModel;
        this.transactionModel = transactionModel;
        this.budgetNotificationService = budgetNotificationService;
    }

    async addBudget(userId, budgetData) {
        const { category, amount, period, startDate, endDate } = budgetData;

        if (!category || !amount || !period) {
            throw new ValidationError('Missing required fields');
        }

        if (!validateCategory(category)) {
            throw new ValidationError('Invalid category');
        }

        try {
            // Create the budget
            const budget = {
                category,
                amount,
                period,
                spent: 0,
                startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
                endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
            };

            const createdBudget = await this.budgetModel.create(userId, budget);

            // Find existing transactions that match this budget's criteria
            const transactions = await this.transactionModel.findByUserId(userId);
            let totalSpent = 0;

            for (const transaction of transactions) {
                const transactionDate = new Date(transaction.date);
                const budgetStartDate = new Date(startDate);
                const budgetEndDate = new Date(endDate);

                if (
                    transaction.category === category &&
                    transactionDate >= budgetStartDate &&
                    transactionDate <= budgetEndDate
                ) {
                    totalSpent += Number(transaction.Amount);

                    // Link the transaction to the budget
                    await this.budgetModel.linkTransactionToBudget(
                        userId,
                        createdBudget.id,
                        transaction.id
                    );
                }
            }

            // Update the budget with the total spent amount
            if (totalSpent > 0) {
                await this.budgetModel.update(userId, createdBudget.id, { spent: totalSpent });

                // Check if budget limit is exceeded and send notification if needed
                await this.budgetNotificationService.checkAndNotifyBudgetLimit(
                    userId,
                    category,
                    totalSpent,
                    amount
                );
            }

            return createdBudget;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to add Budget');
        }
    }

    async getBudgets(userId) {
        if (!userId) {
            throw new ValidationError('Missing userId');
        }

        try {
            return await this.budgetModel.findByUserId(userId);
        } catch (error) {
            throw new DatabaseError('Failed to get Budgets');
        }
    }

    async updateBudget(userId, budgetId, updates) {
        if (!userId || !budgetId) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            const updated = await this.budgetModel.update(userId, budgetId, updates);
            if (!updated) {
                throw new NotFoundError('Budget not found');
            }

            // Check if budget limit is reached after update
            if (updated.spent >= updated.amount) {
                await this.budgetNotificationService.checkAndNotifyBudgetLimit(
                    userId,
                    updated.category,
                    updated.spent,
                    updated.amount
                );
            }

            return updated;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to update Budget');
        }
    }

    async deleteBudget(userId, budgetId) {
        if (!userId || !budgetId) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            const deleted = await this.budgetModel.delete(userId, budgetId);
            if (!deleted) {
                throw new NotFoundError('Budget not found');
            }
            return true;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete Budget');
        }
    }

    async getBudgetSummary(userId) {
        try {
            const budgets = await this.budgetModel.findByUserId(userId);
            const transactions = await this.transactionModel.findByUserId(userId);

            const categoryBreakdown = budgets.map(budget => {
                const categoryTransactions = transactions.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transaction.category === budget.category &&
                        transactionDate >= new Date(budget.startDate) &&
                        transactionDate <= new Date(budget.endDate);
                });

                const spent = categoryTransactions.reduce((sum, transaction) =>
                    sum + (Number(transaction.Amount) || 0), 0);

                return {
                    budgetId: budget.id,
                    category: budget.category,
                    budgetAmount: Number(budget.amount) || 0,
                    spent: spent,
                    remaining: (Number(budget.amount) || 0) - spent,
                    percentageUsed: budget.amount ? ((spent / budget.amount) * 100).toFixed(2) : "0.00"
                };
            });

            const totalBudgets = budgets.reduce((sum, budget) =>
                sum + (Number(budget.amount) || 0), 0);
            const totalSpent = categoryBreakdown.reduce((sum, cat) =>
                sum + cat.spent, 0);

            return {
                totalBudgets,
                totalSpent,
                remaining: totalBudgets - totalSpent,
                categoryBreakdown
            };
        } catch (error) {
            throw new DatabaseError('Failed to get Budget Summary');
        }
    }

    async getBudgetById(userId, budgetId) {
        try {
            const budget = await this.budgetModel.findById(userId, budgetId);
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }
            return budget;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to get budget');
        }
    }

    async getTransactionsByBudgetId(userId, budgetId) {
        try{
            //Get budget to verify if it exists
            const budget = await this.budgetModel.findById(userId, budgetId);
            if(!budget){
                throw new NotFoundError('Budget not found');
            }
            //get tracked transactions
            const trackedTransactions = budget.trackedTransactions || [];
            //if no transactions are tracked, return empty array
            if(trackedTransactions.length === 0){
                return [];
            }
            // get all budget transactions
            const transactions = [];
            for(const transactionId of trackedTransactions){
                const transaction = await this.transactionModel.findById(userId, transactionId);
                if(transaction){
                    transactions.push(transaction);
                }
            }

            return transactions;
        }catch (error) {
            console.error('Error in getTransactionsByBudgetId:', error);
            throw new DatabaseError('Failed to fetch budget transactions');
        }
    }
}

module.exports = BudgetService;