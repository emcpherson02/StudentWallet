class UserModel {
    constructor(db) {
        this.db = db;
        this.collection = 'users';
    }

    async findByEmail(email) {
        const doc = await this.db.collection(this.collection).doc(email).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async findById(userId) {
        const doc = await this.db.collection(this.collection).doc(userId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async create(userData) {
        const { email } = userData;
        await this.db.collection(this.collection).doc(email).set(userData);
        return { id: email, ...userData };
    }

    async update(userId, updates) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            return null;
        }

        await userRef.update(updates);
        return { id: userId, ...updates };
    }

    async getLinkedAccounts(userId) {
        const snapshot = await this.db
            .collection(this.collection)
            .doc(userId)
            .collection('LinkedAccounts')
            .get();

        return snapshot.docs.map(doc => ({
            type: doc.id,
            balance: doc.data().Balance,
        }));
    }

    async delete(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            return false;
        }

        // Delete subcollections
        const subcollections = ['budgets', 'transactions', 'LinkedAccounts'];
        for (const subcollection of subcollections) {
            const snapshot = await userRef.collection(subcollection).get();
            const batch = this.db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }

        // Delete Plaid token if exists
        const plaidTokenRef = this.db.collection('plaid_tokens').doc(userId);
        const plaidTokenDoc = await plaidTokenRef.get();
        if (plaidTokenDoc.exists) {
            await plaidTokenRef.delete();
        }

        // Delete user document
        await userRef.delete();
        return true;
    }
}

module.exports = UserModel;