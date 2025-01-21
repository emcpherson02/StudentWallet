const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { admin } = require('../config/firebase.config');

class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async getUserData(userId) {
        try {
            const userData = await this.userModel.findById(userId);
            if (!userData) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            const linkedBank = userData.linkedBank || false;
            if (!linkedBank) {
                return { linkedBank: false };
            }

            // Get linked accounts if bank is connected
            const accounts = await this.userModel.getLinkedAccounts(userId);
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
            const updatedUser = await this.userModel.update(userId, updates);
            if (!updatedUser) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }
            return updatedUser;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update user details');
        }
    }

    async deleteUser(userId) {
        try {
            const deleted = await this.userModel.delete(userId);
            if (!deleted) {
                throw new NotFoundError('User not found');
            }

            // Remove user from Firebase Authentication
            await admin.auth().deleteUser(userId);

            return { success: true, message: 'User and associated data deleted successfully' };
        } catch (error) {
            throw new DatabaseError('Failed to delete user');
        }
    }
}

module.exports = UserService;