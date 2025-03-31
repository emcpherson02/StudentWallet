const { DatabaseError, NotFoundError, ValidationError} = require('../utils/errors');
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

            // Get all necessary data
            const accounts = await this.userModel.getLinkedAccounts(userId);
            const emailPreferences = await this.userModel.getEmailPreferences(userId);

            return {
                linkedBank: userData.linkedBank || false,
                notificationsEnabled: userData.notificationsEnabled || false,
                accounts: accounts || [],
                dob: userData.dob || null, // Make sure DOB is included in response
                emailPreferences: emailPreferences || {
                    weeklySummary: false,
                    summaryDay: 'sunday',
                    includeTransactions: true,
                    includeBudgets: true,
                    includeLoans: true,
                    includeRecommendations: true
                }
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch user data');
        }
    }

    async getUserDetails(userId) {
        try {
            const userData = await this.userModel.findById(userId);
            if (!userData) {
                throw new NotFoundError(MESSAGE_USER_NOT_FOUND);
            }

            // Return only essential user details
            return {
                id: userData.id,
                displayName: userData.displayName || null,
                email: userData.email || null,
                dob: userData.dob || null,
                createdAt: userData.createdAt ? userData.createdAt.toDate() : null
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to fetch user details');
        }
    }

    async updateUser(userId, updates) {
        try {
            // Ensure DOB is properly processed before saving
            if (updates.dob) {
                try {
                    // Convert to Date object and back to ISO string for consistent storage
                    const dobDate = new Date(updates.dob);
                    if (!isNaN(dobDate.getTime())) {
                        updates.dob = dobDate.toISOString();
                    }
                } catch (e) {
                    console.error('Error formatting DOB during update:', e);
                }
            }

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

            return {success: true, message: 'User and associated data deleted successfully'};
        } catch (error) {
            throw new DatabaseError('Failed to delete user');
        }
    }

    async addCategory(userId, category) {
        if (!userId || !category) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            return await this.userModel.addCategory(userId, category);
        } catch (error) {
            throw new DatabaseError('Failed to add category');
        }
    }

    async getCategories(userId) {
        if (!userId) {
            throw new ValidationError('Missing userId');
        }

        try {
            return await this.userModel.getCategories(userId);
        } catch (error) {
            throw new DatabaseError('Failed to get categories');
        }
    }

    async deleteCategory(userId, category) {
        if (!userId || !category) {
            throw new ValidationError('Missing required parameters');
        }

        try {
            return await this.userModel.deleteCategory(userId, category);
        } catch (error) {
            throw new DatabaseError('Failed to delete category');
        }
    }

    async toggleNotifications(userId, enabled) {
        if (!userId) {
            throw new ValidationError('Missing userId');
        }

        try {
            const updated = await this.userModel.update(userId, {notificationsEnabled: enabled});
            if (!updated) {
                throw new NotFoundError('User not found');
            }
            return {notificationsEnabled: enabled};
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to update notification settings');
        }
    }

    async getNotificationHistory(userId) {
        try {
            return await this.userModel.getNotificationHistory(userId);
        } catch (error) {
            throw new DatabaseError('Failed to fetch notification history');
        }
    }

    // Add method to handle email preferences
    async updateEmailPreferences(userId, emailPreferences) {
        try {
            const updated = await this.userModel.updateEmailPreferences(userId, emailPreferences);
            if (!updated) {
                throw new NotFoundError('User not found');
            }
            return updated;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new DatabaseError('Failed to update email preferences');
        }
    }

    async getEmailPreferences(userId) {
        try {
            const preferences = await this.userModel.getEmailPreferences(userId);
            if (!preferences) {
                // Return default preferences if none exist
                return {
                    weeklySummary: false,
                    summaryDay: 'sunday',
                    includeTransactions: true,
                    includeBudgets: true,
                    includeLoans: true,
                    includeRecommendations: true
                };
            }
            return preferences;
        } catch (error) {
            throw new DatabaseError('Failed to fetch email preferences');
        }
    }

    async changeEmail(userId, newEmail, currentPassword) {
        try {
            // Validate inputs
            if (!userId || !newEmail || !currentPassword) {
                throw new ValidationError('Missing required parameters');
            }

            // Get the user from Firebase Auth
            const userRecord = await admin.auth().getUser(userId);

            if (!userRecord) {
                throw new NotFoundError('User not found');
            }

            try {
                // Update email in Firebase Auth - we can directly update it with admin SDK
                // The admin SDK doesn't need re-authentication
                await admin.auth().updateUser(userId, {
                    email: newEmail,
                    emailVerified: false // Reset email verification status
                });

                // If we get here, the Firebase update was successful

                // Update the email in Firestore database
                const updated = await this.userModel.update(userId, { email: newEmail });

                if (!updated) {
                    throw new DatabaseError('Failed to update user in database');
                }

                return { email: newEmail };

            } catch (error) {
                if (error.code === 'auth/email-already-exists') {
                    throw new ValidationError('The email address is already in use by another account.');
                } else if (error.code === 'auth/invalid-email') {
                    throw new ValidationError('The email address is not valid.');
                } else {
                    throw error;
                }
            }
        } catch (error) {
            // Pass through Firebase Auth errors
            if (error.code && error.code.startsWith('auth/')) {
                throw error;
            }

            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }

            throw new DatabaseError('Failed to change email: ' + error.message);
        }
    }
}

module.exports = UserService;