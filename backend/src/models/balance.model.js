class BalanceModel {
    constructor(db) {
        this.db = db;
        this.collection = 'users';
    }

    async getBalance(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        const balanceDoc = await userRef.collection('balance').doc('current').get();
        return balanceDoc.exists ? balanceDoc.data() : { amount: 0 };
    }

    async updateBalance(userId, amount) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const balanceRef = userRef.collection('balance').doc('current');

        await this.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(balanceRef);
            const newAmount = doc.exists ? doc.data().amount + amount : amount;

            transaction.set(balanceRef, {
                amount: newAmount,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        });

        const updatedBalance = await balanceRef.get();
        return updatedBalance.data();
    }

    async setInitialBalance(userId, amount) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const balanceRef = userRef.collection('balance').doc('current');

        await balanceRef.set({
            amount,
            lastUpdated: new Date().toISOString()
        });

        return { amount };
    }
}

module.exports = BalanceModel;