class BudgetModel {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('users');

    }

    async create(userId, budgetData) {
        const userRef = this.db.collection('users').doc(userId);
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

    async update(userId, budgetId, updates) {
        const budgetRef = this.db
            .collection('users')
            .doc(userId)
            .collection('budgets')
            .doc(budgetId);

        const budgetDoc = await budgetRef.get();
        if (!budgetDoc.exists) {
            return null;
        }

        await budgetRef.update(updates);
        return { id: budgetId, ...updates };
    }

    async delete(userId, budgetId) {
        const budgetRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Budgets')
            .doc(budgetId);

        const budgetDoc = await budgetRef.get();
        if (!budgetDoc.exists) {
            return false;
        }

        await budgetRef.delete();
        return true;
    }
}

module.exports = BudgetModel;