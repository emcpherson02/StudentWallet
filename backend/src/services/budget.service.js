const { DatabaseError, ValidationError, NotFoundError } = require('../utils/errors');
const { validateCategory } = require('../utils/constants');

class BudgetService {
    constructor(budgetModel, transactionModel) {
        this.budgetModel = budgetModel;
        this.transactionModel = transactionModel;
        this.db = budgetModel.db;
    }

    async findByUserId(userId) {
        try {
            const snapshot = await this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('Budgets')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            throw new DatabaseError('Failed to get Budgets');
        }
    }
    async addBudget(userId, budgetData) {
        const { category, amount, period, startDate, endDate } = budgetData;
        const userRef = this.budgetModel.collection('users').doc(userId);
        const userDoc = await userRef.get();
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

            const budgetRef = userRef.collection('Budgets');
            await budgetRef.add(budget);
        } catch (error) {
            throw new DatabaseError('Failed to add Budget');
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
                .collection('Budgets')
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

    async getBudgetSummary(userId) {
        try {
            // Fetch all budgets for the user
            const budgetSnapshot = await this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('Budgets')
                .get();

            const budgets = budgetSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Fetch all transactions for the user
            const transactionsSnapshot = await this.transactionModel.db
                .collection('users')
                .doc(userId)
                .collection('Transactions')
                .get();

            const transactions = transactionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

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
                    transaction => transaction.Description === budget.category
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

            // Return complete budget summary
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
            // Get the budget document reference
            const budgetRef = this.budgetModel
                .collection('users')
                .doc(userId)
                .collection('Budgets')
                .doc(budgetId);

            // Get the budget document
            const budgetDoc = await budgetRef.get();

            // Check if the budget exists
            if (!budgetDoc.exists) {
                throw new NotFoundError('Budget not found');
            }

            // Return the budget data with its ID
            return {
                id: budgetDoc.id,
                ...budgetDoc.data()
            };
        } catch (error) {
            // If it's already a NotFoundError, rethrow it
            if (error instanceof NotFoundError) {
                throw error;
            }
            // Otherwise, wrap it in a DatabaseError
            throw new DatabaseError('Failed to get budget');
        }
    }


}

module.exports = BudgetService;