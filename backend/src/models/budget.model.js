const {budgetModel} = require("./index");
const {NotFoundError} = require("../utils/errors");

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

    async linkTransactionToBudget(userId, budgetId, transactionId) {
        try {
            console.log('Linking transaction to budget:', { userId, budgetId, transactionId });

            // Get current budget data
            const budget = await this.findById(userId, budgetId);
            if (!budget) {
                console.log('Budget not found');
                return false;
            }

            // Initialize or update trackedTransactions array
            const trackedTransactions = budget.trackedTransactions || [];
            if (!trackedTransactions.includes(transactionId)) {
                trackedTransactions.push(transactionId);
            }

            // Update budget with new transaction array
            await this.update(userId, budgetId, {
                trackedTransactions,
                lastUpdated: new Date().toISOString()
            });

            console.log('Transaction linked successfully');
            return true;
        } catch (error) {
            console.error('Error in linkTransactionToBudget:', error);
            return false;
        }
    }

    async removeTransactionTracking(userId, budgetId, transactionId) {
        try {
            // Get current budget data
            const budget = await this.findById(userId, budgetId);
            if (!budget) {
                return false;
            }

            // Remove transaction from tracking array
            const trackedTransactions = (budget.trackedTransactions || [])
                .filter(id => id !== transactionId);

            // Update budget with new transaction array
            await this.update(userId, budgetId, {
                trackedTransactions,
                lastUpdated: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Error in removeTransactionTracking:', error);
            return false;
        }
    }

}

module.exports = BudgetModel;
