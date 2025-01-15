const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { transactionModel } = require('../models');

class TransactionService {
    constructor() {
        this.transactionModel = transactionModel;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, date, description } = transactionData;

            // Create transaction object
            const transaction = {
                Amount: amount,
                date: new Date(date),
                Description: description,
            };

            return await this.transactionModel.create(userId, transaction);
        } catch (error) {
            throw new DatabaseError('Failed to add transaction');
        }
    }

    async getUserTransactions(userId) {
        try {
            const transactions = await this.transactionModel.findByUserId(userId);

            return transactions.map(doc => ({
                id: doc.id,
                type: doc.Description,
                amount: doc.Amount,
                date: doc.date,
            }));
        } catch (error) {
            throw new DatabaseError('Failed to fetch transactions');
        }
    }

    async deleteTransaction(userId, transactionId) {
        try {
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