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

    async findAllWithNotifications() {
        try {
            const snapshot = await this.db.collection(this.collection)
                .where('notificationsEnabled', '==', true)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error finding users with notifications:', error);
            throw error;
        }
    }

    async getNotificationHistory(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const snapshot = await userRef
            .collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
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

    async addCategory(userId, category) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const categoriesRef = userRef.collection('categories').doc('custom');
        const doc = await categoriesRef.get();

        if (!doc.exists) {
            await categoriesRef.set({ categories: [category] });
            return category;
        }

        const currentCategories = doc.data().categories;
        if (!currentCategories.includes(category)) {
            await categoriesRef.update({
                categories: [...currentCategories, category]
            });
        }

        return category;
    }

    async getCategories(userId) {
        const categoriesRef = this.db
            .collection(this.collection)
            .doc(userId)
            .collection('categories')
            .doc('custom');

        const doc = await categoriesRef.get();
        return doc.exists ? doc.data().categories : [];
    }

    async deleteCategory(userId, category) {
        const categoriesRef = this.db
            .collection(this.collection)
            .doc(userId)
            .collection('categories')
            .doc('custom');

        const doc = await categoriesRef.get();
        if (!doc.exists) return false;

        const currentCategories = doc.data().categories;
        const updatedCategories = currentCategories.filter(c => c !== category);

        await categoriesRef.update({ categories: updatedCategories });
        return true;
    }
}

module.exports = UserModel;