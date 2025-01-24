class PlaidModel {
    constructor(db) {
        this.db = db;
    }

    async storeTokens(userId, { accessToken, itemId }) {
        if (!userId || !accessToken || !itemId) {
            throw new Error('Missing required parameters');
        }

        // Get the user document reference
        const userRef = this.db.collection('users').doc(userId);

        // Store tokens in a 'plaidTokens' subcollection
        await userRef.collection('plaidTokens').doc('tokens').set({
            accessToken,
            itemId,
            createdAt: new Date(),
        });

        // Update the linkedBank status in the user document
        await userRef.update({
            linkedBank: true
        });

        return true;
    }

    async getTokens(userId) {
        if (!userId) {
            throw new Error('UserId is required');
        }

        const tokensDoc = await this.db
            .collection('users')
            .doc(userId)
            .collection('plaidTokens')
            .doc('tokens')
            .get();

        if (!tokensDoc.exists) {
            return null;
        }
        return tokensDoc.data();
    }



    async createTransaction(userId, transaction) {
        if (Array.isArray(transaction)) {
            const userRef = this.db.collection('users').doc(userId);
            const batch = this.db.batch();
            const createdTransactions = [];

            // Delete existing Plaid transactions
            const existingTransactions = await userRef
                .collection('Transactions')
                .where('isPlaidTransaction', '==', true)
                .get();

            existingTransactions.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Add new transactions
            for (const trans of transaction) {
                const transactionRef = userRef.collection('Transactions').doc();
                batch.set(transactionRef, trans);
                createdTransactions.push({ id: transactionRef.id, ...trans });
            }

            await batch.commit();
            return createdTransactions;
        } else {
            const userRef = this.db.collection('users').doc(userId);
            const transactionRef = await userRef.collection('Transactions').add(transaction);
            return { id: transactionRef.id, ...transaction };
        }
    }

    async getStoredTransactions(userId) {
        const transactionsRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Transactions');

        // First check if we have any Plaid transactions
        const plaidTransactions = await transactionsRef
            .where('isPlaidTransaction', '==', true)
            .get();

        return plaidTransactions.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
}

module.exports = PlaidModel;