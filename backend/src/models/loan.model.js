const { NotFoundError, ValidationError } = require('../utils/errors');

class LoanModel {
    constructor(db) {
        this.db = db;
    }

    async create(userId, loanData) {
        console.log('Creating loan for user:', userId);
        const userRef = this.db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            console.log('User not found in database');
            throw new NotFoundError('User not found');
        }

        // Check if user already has a loan
        console.log('Checking for existing loans...');
        const existingLoan = await userRef.collection('MaintenanceLoan').limit(1).get();
        if (!existingLoan.empty) {
            console.log('Existing loan found');
            throw new ValidationError('User already has a maintenance loan');
        }

        console.log('Creating new loan with data:', loanData);
        const loanData2 = {
            ...loanData,
            trackedTransactions: [],
            remainingAmount: loanData.totalAmount,
            createdAt: new Date().toISOString()
        };

        try {
            const loanRef = await userRef.collection('MaintenanceLoan').add(loanData2);
            console.log('Loan created successfully with ID:', loanRef.id);
            const createdLoan = { id: loanRef.id, ...loanData2 };
            console.log('Returning created loan:', createdLoan);
            return createdLoan;
        } catch (error) {
            console.error('Error creating loan in Firestore:', error);
            throw error;
        }
    }

    async findByUserId(userId) {
        console.log('Finding loans for user:', userId);
        try {
            const snapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('MaintenanceLoan')
                .get();

            console.log('Number of loans found:', snapshot.size);

            const loans = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Loan document data:', data);
                return { id: doc.id, ...data };
            });

            return loans;
        } catch (error) {
            console.error('Error finding loans:', error);
            throw error;
        }
    }

    async update(userId, loanId, updates) {
        const loanRef = this.db
            .collection('users')
            .doc(userId)
            .collection('MaintenanceLoan')
            .doc(loanId);

        const doc = await loanRef.get();
        if (!doc.exists) {
            return null;
        }

        await loanRef.update(updates);
        const updatedDoc = await loanRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }

    async delete(userId, loanId) {
        const loanRef = this.db
            .collection('users')
            .doc(userId)
            .collection('MaintenanceLoan')
            .doc(loanId);

        const doc = await loanRef.get();
        if (!doc.exists) {
            return false;
        }

        await loanRef.delete();
        return true;
    }

    async linkTransactionToLoan(userId, loanId, transactionId, transactionAmount) {
        const loanRef = this.db
            .collection('users')
            .doc(userId)
            .collection('MaintenanceLoan')
            .doc(loanId);

        const doc = await loanRef.get();
        if (!doc.exists) {
            return false;
        }

        const currentLoan = doc.data();
        const trackedTransactions = currentLoan.trackedTransactions || [];
        const remainingAmount = (currentLoan.remainingAmount || 0) - transactionAmount;

        if (!trackedTransactions.includes(transactionId)) {
            trackedTransactions.push(transactionId);
        }

        await loanRef.update({
            trackedTransactions,
            remainingAmount,
            lastUpdated: new Date().toISOString()
        });

        return true;
    }

    async removeTransactionFromLoan(userId, loanId, transactionId, transactionAmount) {
        const loanRef = this.db
            .collection('users')
            .doc(userId)
            .collection('MaintenanceLoan')
            .doc(loanId);

        const doc = await loanRef.get();
        if (!doc.exists) {
            return false;
        }

        const currentLoan = doc.data();
        const trackedTransactions = (currentLoan.trackedTransactions || [])
            .filter(id => id !== transactionId);
        const remainingAmount = (currentLoan.remainingAmount || 0) + transactionAmount;

        await loanRef.update({
            trackedTransactions,
            remainingAmount,
            lastUpdated: new Date().toISOString()
        });

        return true;
    }
}

module.exports = LoanModel;