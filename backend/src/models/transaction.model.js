const { NotFoundError } = require('../utils/errors');

class TransactionModel {
    constructor(db, budgetModel) {
        this.db = db;
        this.collection = 'users';
    }

    async create(userId, transactionData) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new NotFoundError('User not found');
        }

        const transactionRef = await userRef.collection('Transactions').add(transactionData);
        return {id: transactionRef.id, ...transactionData};
    }

    async findByUserId(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new NotFoundError('User not found');
        }

        const snapshot = await userRef.collection('Transactions').get();
        return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    }

    async findById(userId, transactionId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const transactionDoc = await userRef
            .collection('Transactions')
            .doc(transactionId)
            .get();

        if (!transactionDoc.exists) {
            return null;
        }

        return {id: transactionDoc.id, ...transactionDoc.data()};
    }

    async delete(userId, transactionId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const transactionRef = userRef.collection('Transactions').doc(transactionId);

        const doc = await transactionRef.get();
        if (!doc.exists) {
            return false;
        }

        await transactionRef.delete();
        return true;
    }

    async update(userId, transactionId, updates) {
        const TransactionRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Transactions')
            .doc(transactionId);

        const doc = await TransactionRef.get();
        if (!doc.exists) {
            return null;
        }

        await TransactionRef.update(updates);
        const updatedDoc = await TransactionRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };


    }
}
module.exports = TransactionModel;