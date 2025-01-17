const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');

class TransactionService {
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, date, description } = transactionData;
            const userRef = this.transactionModel.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const transaction = {
                Amount: amount,
                date: new Date(date),
                Description: description,
            };

            const transactionsRef = userRef.collection('Transactions');
            await transactionsRef.add(transaction);

            return transaction;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to add transaction');
        }
    }

    async getUserTransactions(userId) {
        try {
            const userRef = this.transactionModel.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const transactionsSnapshot = await userRef
                .collection('Transactions')
                .get();

            if (transactionsSnapshot.empty) {
                return [];
            }

            return transactionsSnapshot.docs.map(doc => ({
                id: doc.id,
                type: doc.data().Description,
                amount: doc.data().Amount,
                date: doc.data().date,
            }));
        } catch (error) {
            console.error('Transaction fetch error:', error);

            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch transactions');
        }
    }


    async deleteTransaction(userId, transactionId) {
        try {
            const transactionRef = this.transactionModel
                .collection('users')
                .doc(userId)
                .collection('Transactions')
                .doc(transactionId);

            const transactionDoc = await transactionRef.get();
            if (!transactionDoc.exists) {
                throw new NotFoundError('Transaction not found');
            }

            await transactionRef.delete();
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