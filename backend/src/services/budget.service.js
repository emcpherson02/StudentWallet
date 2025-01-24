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
            const budget = {
                category,
                amount,
                period,
                spent: 0,
                startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
                endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
            };

            return await this.budgetModel.create(userId, budget);
        } catch (error) {
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
            // Get all budgets and transactions from models
            const budgets = await this.budgetModel.findByUserId(userId);
            const transactions = await this.transactionModel.findByUserId(userId);

            // Calculate total budget amount across all categories
            const totalBudgets = budgets.reduce((sum, budget) =>
                sum + (Number(budget.amount) || 0), 0);

            // Calculate total amount spent across all transactions
            const totalSpent = transactions.reduce((sum, transaction) =>
                sum + (Number(transaction.Amount) || 0), 0);

            // Generate detailed breakdown for each budget category
            const categoryBreakdown = budgets.map(budget => {
                // Find transactions that match this budget category
                const categoryTransactions = transactions.filter(
                    transaction => transaction.category === budget.category
                );

                // Calculate total spent in this category
                const spent = categoryTransactions.reduce((sum, transaction) =>
                    sum + (Number(transaction.Amount) || 0), 0);

                // Return comprehensive information for this category
                return {
                    category: budget.category,
                    budgetAmount: Number(budget.amount) || 0,
                    spent: spent,
                    remaining: (Number(budget.amount) || 0) - spent,
                    percentageUsed: budget.amount ? ((spent / budget.amount) * 100).toFixed(2) : "0.00"
                };
            });

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
}

module.exports = BudgetService;