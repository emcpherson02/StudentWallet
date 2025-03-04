const { admin } = require('../config/firebase.config');
const { AuthenticationError, DatabaseError } = require('../utils/errors');
const {
    MESSAGE_INVALID_CREDENTIALS,
    MESSAGE_USER_EXISTS,
    MESSAGE_ERROR_OCCURRED
} = require('../utils/constants');

class AuthService {
    constructor(authModel, mfaModel) {
        this.authModel = authModel;
        this.mfaModel = mfaModel;
    }

    async loginUser(email, password) {
        try {
            const user = await this.authModel.findByEmail(email);

            if (!user || user.password !== password) {
                throw new AuthenticationError(MESSAGE_INVALID_CREDENTIALS);
            }

            // Check if MFA is enabled for this user
            let mfaRequired = false;
            if (this.mfaModel) {
                try {
                    const mfaSettings = await this.mfaModel.getMfaSettings(user.id);
                    mfaRequired = mfaSettings.enabled || false;
                } catch (error) {
                    console.error('Error checking MFA status:', error);
                    // Continue login process even if MFA check fails
                }
            }

            const token = await admin.auth().createCustomToken(email);

            return {
                token,
                user,
                mfaRequired
            };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async registerUser(userData) {
        const { name, dob, email, password } = userData;

        try {
            const existingUser = await this.authModel.findByEmail(email);

            if (existingUser) {
                throw new AuthenticationError(MESSAGE_USER_EXISTS);
            }

            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name
            });

            const user = await this.authModel.createUser(email, {
                name,
                dob,
                email,
                password,
                notificationsEnabled: false,  // Set default value when creating user
                mfaEnabled: false             // Initialize MFA as disabled
            });

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async googleAuth(profile) {
        try {
            return await this.authModel.createOrUpdateGoogleUser(profile);
        } catch (error) {
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async validateToken(token) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            throw new AuthenticationError('Invalid token');
        }
    }

    async validateMfa(userId, verificationCode) {
        try {
            if (!this.mfaModel) {
                return { success: true };
            }

            // Check if MFA is enabled
            const mfaSettings = await this.mfaModel.getMfaSettings(userId);
            if (!mfaSettings.enabled) {
                return { success: true };
            }

            // Verify the code
            const result = await this.mfaModel.verifyMfaCode(userId, verificationCode);
            if (!result.success) {
                throw new AuthenticationError('Invalid MFA verification code');
            }

            return { success: true };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError('MFA validation failed');
        }
    }
}

module.exports = AuthService;