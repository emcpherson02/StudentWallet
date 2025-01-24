class PlaidModel {
    constructor(db) {
        this.db = db;
    }

    async storeTokens(userId, { accessToken, itemId }) {
        if (!userId || !accessToken || !itemId) {
            throw new Error('Missing required parameters');
        }

        // Get the user document reference
        const userRef = this.db.collection('users').doc(userId);

        // Store tokens in a 'plaidTokens' subcollection
        await userRef.collection('plaidTokens').doc('tokens').set({
            accessToken,
            itemId,
            createdAt: new Date(),
        });

        // Update the linkedBank status in the user document
        await userRef.update({
            linkedBank: true
        });

        return true;
    }

    async getTokens(userId) {
        if (!userId) {
            throw new Error('UserId is required');
        }

        const tokensDoc = await this.db
            .collection('users')
            .doc(userId)
            .collection('plaidTokens')
            .doc('tokens')
            .get();

        if (!tokensDoc.exists) {
            return null;
        }
        return tokensDoc.data();
    }

    async storeTransactions(userId, transactions) {
        const userRef = this.db.collection('users').doc(userId);
        const batch = this.db.batch();

        const existingTransactions = await userRef
            .collection('Transactions')
            .where('isPlaidTransaction', '==', true)
            .get();

        existingTransactions.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        transactions.forEach(transaction => {
            const transactionRef = userRef.collection('Transactions').doc();
            batch.set(transactionRef, transaction);
        });

        await batch.commit();
        return true;
    }

    async storeTransactionsWithBudgetLink(userId, transactions) {
        const userRef = this.db.collection('users').doc(userId);

        // Delete existing Plaid transactions
        const existingTransactions = await userRef
            .collection('Transactions')
            .where('isPlaidTransaction', '==', true)
            .get();

        for (const doc of existingTransactions.docs) {
            await doc.ref.delete();
        }

        // Store and link each transaction
        const storedTransactions = [];
        for (const transaction of transactions) {
            // Create transaction
            const transactionRef = await userRef.collection('Transactions').add(transaction);
            const createdTransaction = { id: transactionRef.id, ...transaction };

            // Find matching budget
            const budgetsSnapshot = await userRef
                .collection('Budgets')
                .where('category', '==', transaction.category)
                .get();

            if (!budgetsSnapshot.empty) {
                const budget = { id: budgetsSnapshot.docs[0].id, ...budgetsSnapshot.docs[0].data() };

                // Update spent amount
                const newSpent = (budget.spent || 0) + Number(transaction.Amount);
                await userRef.collection('Budgets').doc(budget.id).update({
                    spent: newSpent
                });

                // Link transaction to budget using same method as manual transactions
                await this.budgetModel.linkTransactionToBudget(userId, budget.id, transactionRef.id);
            }

            storedTransactions.push(createdTransaction);
        }

        return storedTransactions;
    }

    async createTransaction(userId, transaction) {
        const userRef = this.db.collection('users').doc(userId);
        const transactionRef = await userRef.collection('Transactions').add(transaction);
        return { id: transactionRef.id, ...transaction };
    }

    async getStoredTransactions(userId) {
        const transactionsRef = this.db
            .collection('users')
            .doc(userId)
            .collection('Transactions');

        // First check if we have any Plaid transactions
        const plaidTransactions = await transactionsRef
            .where('isPlaidTransaction', '==', true)
            .get();

        return plaidTransactions.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
}

module.exports = PlaidModel;