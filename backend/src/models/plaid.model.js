class PlaidModel {
    constructor(db) {
        this.db = db;
    }

    async storeTokens(userId, { accessToken, itemId }) {
        if (!userId || !accessToken || !itemId) {
            throw new Error('Missing required parameters');
        }

        await this.db.collection('plaid_tokens').doc(userId).set({
            linkedBank: true,
            accessToken,
            itemId,
            createdAt: new Date(),
        });
        return true;
    }

    async getTokens(userId) {
        if (!userId) {
            throw new Error('UserId is required');
        }

        const doc = await this.db.collection('plaid_tokens').doc(userId).get();
        if (!doc.exists) {
            return null;
        }
        return doc.data();
    }
}

module.exports = PlaidModel;