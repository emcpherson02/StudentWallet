const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const {admin} = require('../config/firebase.config');

class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async getUserData(userId) {
        try {
            const userDoc = await this.userModel.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const userData = userDoc.data();
            const linkedBank = userData.linkedBank || false;

            if (!linkedBank) {
                return { linkedBank: false };
            }

            // Get linked accounts if bank is connected
            const accountsSnapshot = await this.userModel
                .collection('users')
                .doc(userId)
                .collection('LinkedAccounts')
                .get();

            const accounts = accountsSnapshot.docs.map(doc => ({
                type: doc.id,
                balance: doc.data().Balance,
            }));

            return { linkedBank: true, accounts };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch user data');
        }
    }

    async updateUser(userId, updates) {
        try {
            const userRef = this.userModel.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const userUpdates = {
                ...(updates.displayName && { displayName: updates.displayName }),
                ...(updates.email && { email: updates.email }),
                ...(updates.dob && { dob: new Date(updates.dob) }),
                ...(updates.linkedBank !== undefined && { linkedBank: updates.linkedBank })
            };

            await userRef.update(userUpdates);
            return { id: userId, ...userUpdates };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update user details');
        }
    }

    async deleteUser(userId) {
        const userRef = this.userModel.collection('users').doc(userId);

        // Check if user exists
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        // Delete all subcollections if they exist
        const subcollections = ['budgets', 'transactions'];
        for (const subcollection of subcollections) {
            const subcollectionSnapshot = await userRef.collection(subcollection).get();
            if (!subcollectionSnapshot.empty) {
                const batch = this.userModel.batch();
                subcollectionSnapshot.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
        }

        // Check if Plaid token exists and delete it if it does
        const plaidTokenRef = this.userModel.collection('plaid_tokens').doc(userId);
        const plaidTokenDoc = await plaidTokenRef.get();
        if (plaidTokenDoc.exists) {
            await plaidTokenRef.delete();
        }

        // Delete user document
        await userRef.delete();

        // Remove user from Firebase Authentication
        await admin.auth().deleteUser(userId);

        return { success: true, message: 'User and associated data deleted successfully' };
    }
}

module.exports = UserService;