const admin = require('firebase-admin');
const serviceAccount = require('D:/Projects/CSC3032-2425-Team15/backend/src/utils/firebaseSDK.json'); // Replace with your service account JSON file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const userId = 'gw9dQN10jcbU7MIoUghrtXopR9C2'; // Replace with your user ID

const generateHistoricalData = async (db, userId) => {
    for (const category of ['Entertainment', 'Groceries', 'Rent', 'Utilities']) {
        const historyRef = db.collection('users').doc(userId)
            .collection('BudgetHistory').doc(category);
        const records = {};

        for (let month = 0; month < 12; month++) {
            const date = new Date(2024, month, 1);
            const yearMonth = date.toISOString().slice(0, 7);
            const endDate = new Date(2024, month + 1, 0);

            const seasonalFactor = getSeasionalFactor(category, month);
            const utilization = calculateUtilization(category, seasonalFactor);
            const baseAmount = getBaseAmount(category);
            const actualSpent = (baseAmount * (utilization / 100));

            records[yearMonth] = {
                actualSpent: Number(actualSpent.toFixed(2)),
                budgetId: `${userId}_${category}_${yearMonth}`,
                category: category,
                createdAt: new Date(date).toISOString(),
                endDate: endDate.toISOString().split('T')[0],
                originalAmount: baseAmount,
                period: "Monthly",
                startDate: date.toISOString().split('T')[0],
                status: utilization > 100 ? "EXCEEDED" : "WITHIN_LIMIT",
                utilizationPercentage: Number(utilization.toFixed(2))
            };
        }

        await historyRef.set({
            category: category,
            period: "Monthly",
            records: records
        }, { merge: true });

        console.log(`Added history for ${category} for user ${userId}`);
    }
};

const getSeasionalFactor = (category, month) => {
    if (category === 'Utilities') {
        return (month < 2 || month > 10 || (month >= 5 && month <= 7)) ? 1.3 : 0.8;
    }
    if (category === 'Entertainment') {
        return (month >= 5 && month <= 7) ? 1.2 : 1;
    }
    return 1;
};

const calculateUtilization = (category, seasonalFactor) => {
    switch (category) {
        case 'Entertainment': return (Math.random() * (95 - 75) + 75) * seasonalFactor;
        case 'Groceries': return Math.random() * (98 - 85) + 85;
        case 'Rent': return 100;
        case 'Utilities': return (Math.random() * (90 - 70) + 70) * seasonalFactor;
    }
};

const getBaseAmount = (category) => ({
    'Entertainment': 200,
    'Groceries': 200,
    'Rent': 800,
    'Utilities': 200
}[category]);

generateHistoricalData(db, userId)
    .then(() => console.log('History generation complete'))
    .catch(console.error)
    .finally(() => process.exit());