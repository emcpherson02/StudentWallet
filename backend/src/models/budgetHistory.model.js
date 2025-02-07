class BudgetHistoryModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, historyData) {
        const userRef = this.db.collection('users').doc(userId);
        const historyRef = await userRef.collection('BudgetHistory').add({
            ...historyData,
            createdAt: new Date(),
        });
        return { id: historyRef.id, ...historyData };
    }

    async findByCategory(userId, category, startDate, endDate) {
        let query = this.db
            .collection('users')
            .doc(userId)
            .collection('BudgetHistory')
            .where('category', '==', category);

        if (startDate && endDate) {
            query = query
                .where('endDate', '>=', startDate)
                .where('endDate', '<=', endDate);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async findByPeriod(userId, startDate, endDate) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('BudgetHistory')
            .where('endDate', '>=', startDate)
            .where('endDate', '<=', endDate)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}

module.exports = BudgetHistoryModel;