const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { userModel } = require('../models');

class UserService {
    constructor() {
        this.db = userModel;
    }

    async getUserData(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const userData = userDoc.data();
            const linkedBank = userData.linkedBank || false;

            if (!linkedBank) {
                return { linkedBank: false };
            }

            // Get linked accounts if bank is connected
            const accountsSnapshot = await this.db
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
            const userRef = this.db.collection('users').doc(userId);
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
}

module.exports = UserService;