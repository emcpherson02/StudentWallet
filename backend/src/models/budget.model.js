class BudgetModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, budgetData) {
        const userRef = this.db.collection('users').doc(userId);
        const budgetRef = await userRef.collection('budgets').add(budgetData);
        return { id: budgetRef.id, ...budgetData };
    }

    async findByUserId(userId) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('budgets')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}

module.exports = BudgetModel;