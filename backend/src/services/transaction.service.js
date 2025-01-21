const { DatabaseError, NotFoundError, ValidationError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { validateCategory } = require('../utils/constants');

class TransactionService {
    constructor(transactionModel, budgetModel) {
        this.transactionModel = transactionModel;
        this.budgetModel = budgetModel;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, category, date, description } = transactionData;

            // Check if user exists first
            const transaction = {
                Amount: amount,
                category,
                date: new Date(date).toISOString().split('T')[0],
                Description: description,
            };

            // Create transaction using the model
            const createdTransaction = await this.transactionModel.create(userId, transaction);

            // If category exists, update the corresponding budget
            if (category) {
                const budgets = await this.budgetModel.findByCategory(userId, category);
                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const newSpent = (budget.spent || 0) + Number(amount);
                    await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                }
            }

            return createdTransaction;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
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
            const transaction = await this.transactionModel.findById(userId, transactionId);
            if (!transaction) {
                throw new NotFoundError('Transaction not found');
            }

            // If the transaction has a category, update the corresponding budget
            if (transaction.category) {
                const budgets = await this.budgetModel.findByCategory(userId, transaction.category);
                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const newSpent = (budget.spent || 0) - Number(transaction.Amount);
                    await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                }
            }

            // Delete the transaction
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