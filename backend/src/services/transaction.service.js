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
            console.log('Starting addTransaction with:', { userId, transactionData });

            const { amount, category, date, description } = transactionData;
            console.log('Parsed transaction data:', { amount, category, date, description });

            const userRef = this.db.collection('users').doc(userId);
            console.log('User ref created');

            const userDoc = await userRef.get();
            console.log('User doc exists:', userDoc.exists);

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const transaction = {
                Amount: amount,
                category,
                date: new Date(date),
                Description: description,
            };
            console.log('Transaction object created:', transaction);

            const transactionsRef = userRef.collection('Transactions');
            console.log('About to add transaction');

            const result = await transactionsRef.add(transaction);
            console.log('Transaction added with ID:', result.id);

            // Find and update corresponding budget
            const budgetSnapshot = await userRef
                .collection('Budgets')
                .where('category', '==', category)
                .get();
            console.log('Budget snapshot empty:', budgetSnapshot.empty);

            if (!budgetSnapshot.empty) {
                const budgetDoc = budgetSnapshot.docs[0];
                const currentBudget = budgetDoc.data();
                const newSpent = (currentBudget.spent || 0) + Number(amount);

                await budgetDoc.ref.update({ spent: newSpent });
                console.log('Budget updated with new spent amount:', newSpent);
            }

            return { id: result.id, ...transaction };
        } catch (error) {
            console.error('Error in addTransaction:', error);
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

    async findUserById(userId) {
        const userRef = this.transactionModel.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
        }

        return userDoc.data();
    }
}

module.exports = TransactionService;