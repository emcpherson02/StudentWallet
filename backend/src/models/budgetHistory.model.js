class BudgetHistoryModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, historyData) {
        const userRef = this.db.collection('users').doc(userId);
        const categoryHistoryRef = userRef
            .collection('BudgetHistory')
            .doc(historyData.category);

        const startDate = new Date(historyData.startDate);
        const yearMonth = startDate.toISOString().slice(0, 7); // YYYY-MM

        // Get or create category document
        const categoryDoc = await categoryHistoryRef.get();
        if (!categoryDoc.exists) {
            await categoryHistoryRef.set({
                category: historyData.category,
                period: historyData.period,
                records: {}
            });
        }

        // Update records
        await categoryHistoryRef.update({
            [`records.${yearMonth}`]: {
                ...historyData,
                createdAt: new Date()
            }
        });

        return historyData;
    }

    async findByCategory(userId, category, startDate, endDate) {
        const historyRef = this.db
            .collection('users')
            .doc(userId)
            .collection('BudgetHistory')
            .doc(category);

        const doc = await historyRef.get();
        if (!doc.exists) return [];

        const data = doc.data();
        const startYearMonth = startDate.slice(0, 7);
        const endYearMonth = endDate.slice(0, 7);

        return Object.entries(data.records)
            .filter(([yearMonth]) => yearMonth >= startYearMonth && yearMonth <= endYearMonth)
            .map(([_, record]) => record);
    }

    async findByPeriod(userId, startDate, endDate) {
        const snapshot = await this.db
            .collection('users')
            .doc(userId)
            .collection('BudgetHistory')
            .get();

        const startYearMonth = startDate.slice(0, 7);
        const endYearMonth = endDate.slice(0, 7);
        const allRecords = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            Object.entries(data.records)
                .filter(([yearMonth]) => yearMonth >= startYearMonth && yearMonth <= endYearMonth)
                .forEach(([_, record]) => allRecords.push(record));
        });

        return allRecords;
    }
}

module.exports = BudgetHistoryModel;