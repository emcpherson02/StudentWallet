class BudgetModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, budgetData) {
        const userRef = this.db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        const budgetRef = await userRef.collection('Budgets').add(budgetData);
        return { id: budgetRef.id, ...budgetData };
    }

    async findByUserId(userId) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async findById(userId, budgetId) {
        const doc = await this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .doc(budgetId)
            .get();

        if (!doc.exists) {
            return null;
        }

        return { id: doc.id, ...doc.data() };
    }

    async findByCategory(userId, category) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .where('category', '==', category)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async update(userId, budgetId, updates) {
        const budgetRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .doc(budgetId);

        const doc = await budgetRef.get();
        if (!doc.exists) {
            return null;
        }

        await budgetRef.update(updates);
        const updatedDoc = await budgetRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    async delete(userId, budgetId) {
        const budgetRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .doc(budgetId);

        const doc = await budgetRef.get();
        if (!doc.exists) {
            return false;
        }

        await budgetRef.delete();
        return true;
    }
}

module.exports = BudgetModel;