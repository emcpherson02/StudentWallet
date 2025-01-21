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
}

module.exports = PlaidModel;