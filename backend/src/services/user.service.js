const { DatabaseError, NotFoundError } = require('../utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../utils/constants');
const { admin } = require('../config/firebase.config');

class UserService {
    constructor(userModel, budgetModel, budgetNotificationService) {
        this.userModel = userModel;
        this.budgetModel = budgetModel;
        this.budgetNotificationService = budgetNotificationService;
    }

    async getUserData(userId) {
        try {
            const userData = await this.userModel.findById(userId);
            if (!userData) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            // Return both linkedBank and notificationsEnabled status
            return {
                linkedBank: userData.linkedBank || false,
                notificationsEnabled: userData.notificationsEnabled || false
            };

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

    async toggleNotifications(userId, enabled) {
        try {
            const updates = {
                notificationsEnabled: enabled
            };

            const updatedUser = await this.userModel.update(userId, updates);
            if (!updatedUser) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            // If notifications are enabled, check existing budgets
            if (enabled) {
                await this.checkExistingBudgets(userId);
            }

            console.log(`Notifications ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);

            return updatedUser;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update notification settings');
        }
    }

    async checkExistingBudgets(userId) {
        try {
            // Get all budgets for the user
            const budgets = await this.budgetModel.findByUserId(userId);

            // Check each budget and send notification if exceeded
            for (const budget of budgets) {
                if (budget.spent >= budget.amount) {
                    await this.budgetNotificationService.checkAndNotifyBudgetLimit(
                        userId,
                        budget.category,
                        budget.spent,
                        budget.amount
                    );
                }
            }
        } catch (error) {
            console.error('Error checking existing budgets:', error);
            // Don't throw error to prevent blocking notification toggle
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