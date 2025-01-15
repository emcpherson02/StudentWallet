const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');
const { budgetModel } = require('../models');

class BudgetService {
    constructor() {
        this.budgetModel = budgetModel;
    }

    async addBudget(userId, budgetData) {
        const { category, amount, period, startDate, endDate } = budgetData;

        if (!category || !amount || !period) {
            throw new ValidationError('Missing required fields');
        }

        try {
            const budget = {
                category,
                amount,
                period,
                spent: 0,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
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
        if (!userId || !budgetId) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            const budgetUpdates = {
                ...(updates.category && { category: updates.category }),
                ...(updates.amount && { amount: updates.amount }),
                ...(updates.period && { period: updates.period }),
                ...(updates.spent !== undefined && { spent: updates.spent }),
                ...(updates.startDate && { startDate: new Date(updates.startDate) }),
                ...(updates.endDate && { endDate: new Date(updates.endDate) }),
            };

            const budget = await this.budgetModel.update(userId, budgetId, budgetUpdates);
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }
            return budget;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
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
}

module.exports = BudgetService;