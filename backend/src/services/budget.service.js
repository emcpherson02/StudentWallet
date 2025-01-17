const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');


class BudgetService {
    constructor(BudgetModel) {
        this.budgetModel = BudgetModel;
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

            const userRef = this.budgetModel.collection('users').doc(userId);
            const budgetsRef = userRef.collection('budgets');
            await budgetsRef.add(budget);

            return budget;
        } catch (error) {
            throw new DatabaseError('Failed to add Budget');
        }
    }

    async getBudgets(userId) {
        if (!userId) {
            throw new ValidationError('Missing userId');
        }

        try {
            const budgetSnapshot = await this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('budgets')
                .get();

            return budgetSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new DatabaseError('Failed to get Budgets');
        }
    }

    async updateBudget(userId, budgetId, updates) {
        if (!userId || !budgetId) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            const budgetRef = this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('budgets')
                .doc(budgetId);

            const budgetDoc = await budgetRef.get();
            if (!budgetDoc.exists) {
                throw new NotFoundError('Budget not found');
            }

            const budgetUpdates = {
                ...(updates.category && { category: updates.category }),
                ...(updates.amount && { amount: updates.amount }),
                ...(updates.period && { period: updates.period }),
                ...(updates.spent !== undefined && { spent: updates.spent }),
                ...(updates.startDate && { startDate: new Date(updates.startDate) }),
                ...(updates.endDate && { endDate: new Date(updates.endDate) }),
            };

            await budgetRef.update(budgetUpdates);
            return { id: budgetId, ...budgetUpdates };
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
            const budgetRef = this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('budgets')
                .doc(budgetId);

            const budgetDoc = await budgetRef.get();
            if (!budgetDoc.exists) {
                throw new NotFoundError('Budget not found');
            }

            await budgetRef.delete();
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