class TransactionModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, transactionData) {
        const userRef = this.db.collection('users').doc(userId);
        const transactionRef = await userRef.collection('Transactions').add(transactionData);
        return { id: transactionRef.id, ...transactionData };
    }

    async findByUserId(userId) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('Transactions')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async delete(userId, transactionId) {
        const transactionRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Transactions')
            .doc(transactionId);

        const doc = await transactionRef.get();
        if (!doc.exists) {
            return false;
        }

        await transactionRef.delete();
        return true;
    }
}

module.exports = TransactionModel;