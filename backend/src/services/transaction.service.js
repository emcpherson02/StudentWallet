const { DatabaseError, NotFoundError, ValidationError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { validateCategory } = require('../utils/constants');

class TransactionService {
    constructor(db, budgetModel) {

        this.budgetModel = budgetModel;
        this.db = db;
    }

    async addTransaction(userId, transactionData) {
        try {
            const { amount, category, date, description } = transactionData;
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const transaction = {
                Amount: amount,
                category,
                date: new Date(date).toISOString().split('T')[0],
                Description: description,
            };

            const transactionsRef = userRef.collection('Transactions');
            const result = await transactionsRef.add(transaction);

            const budgetSnapshot = await userRef
                .collection('Budgets')
                .where('category', '==', category)
                .get();

            if (!budgetSnapshot.empty) {
                const budgetDoc = budgetSnapshot.docs[0];
                const currentBudget = budgetDoc.data();
                const newSpent = (currentBudget.spent || 0) + Number(amount);
                await budgetDoc.ref.update({ spent: newSpent });
            }

            return { id: result.id, ...transaction };
        } catch (error) {
            throw new DatabaseError('Failed to add transaction');
        }
    }

    async getUserTransactions(userId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
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
                category: doc.data().category,
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
            const transactionRef = this.db
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

    async findUserById(userId) {
        const userRef = this.db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
        }

        return userDoc.data();
    }
}

module.exports = TransactionService;