const {NotFoundError} = require("../utils/errors");

class BalanceModel {
    constructor(db) {
        this.db = db;
        this.collection = 'users';
    }

    async create(userId, balanceData) {
        const userRef = this.db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        const balanceRef = await userRef.collection('Balance').add(balanceData);
        return { id: balanceRef.id, ...balanceData };
    }

    async findById(userId, balanceId) {
        const doc = await this.db
            .collection('users')
            .doc(userId)
            .collection('Balance')
            .doc(balanceId)
            .get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() };
    }

    async findByUserId(userId) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('Balance')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async update(userId, balanceId, updates) {
        const balanceRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Balance')
            .doc(balanceId);

        const doc = await balanceRef.get();
        if (!doc.exists) {
            return null;
        }

        await balanceRef.update(updates);
        const updatedDoc = await balanceRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    async linkTransactionToBalance(userId, balanceId, transactionId) {
        try {
            console.log('Linking transaction to balance:', {userId, balanceId, transactionId});

            // get current balance data
            const balance = await this.findById(userId, balanceId);
            if (!balance) {
                console.log('Balance not found.');
                return false;
            }

            // Initialize or update trackedTransactions array
            const trackedTransactions = balance.trackedTransactions || [];
            if (!trackedTransactions.includes(transactionId)) {
                trackedTransactions.push(transactionId);
            }

            // Update balance with new transaction array
            await this.update(userId, balanceId, {
                trackedTransactions,
                lastUpdated: new Date().toISOString()
            });

            console.log('Transaction linked successfully');
            return true;
        } catch (error) {
            console.error('Error in linkTransactionToBalance:', error);
            return false;
        }
    }

}

module.exports = BalanceModel;