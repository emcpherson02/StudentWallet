const { DatabaseError, ValidationError, NotFoundError, AuthenticationError } = require('../utils/errors');
const { admin } = require('../config/firebase.config');

class MfaService {
    constructor(mfaModel, userModel) {
        this.mfaModel = mfaModel;
        this.userModel = userModel;
    }

    async enableMfa(userId, phoneNumber) {
        try {
            // Validate phone number format (basic validation)
            if (!phoneNumber || !this.isValidPhoneNumber(phoneNumber)) {
                throw new ValidationError('Invalid phone number format');
            }

            // Check if user exists
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Enable MFA in our database
            await this.mfaModel.enableMfa(userId, phoneNumber);

            return {
                success: true,
                message: 'MFA enabled successfully'
            };
        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to enable MFA');
        }
    }

    async disableMfa(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            await this.mfaModel.disableMfa(userId);

            return {
                success: true,
                message: 'MFA disabled successfully'
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to disable MFA');
        }
    }

    async getMfaStatus(userId) {
        try {
            const settings = await this.mfaModel.getMfaSettings(userId);
            return {
                enabled: settings.enabled || false,
                phoneNumber: settings.phoneNumber || null
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to get MFA status');
        }
    }

    async sendVerificationCode(userId) {
        try {
            // Get MFA settings
            const settings = await this.mfaModel.getMfaSettings(userId);

            if (!settings.enabled) {
                throw new ValidationError('MFA is not enabled for this user');
            }

            // Generate a random 6-digit verification code
            const verificationCode = this.generateVerificationCode();

            // Set expiry time (5 minutes from now)
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 5);

            // Store the verification code in the database
            await this.mfaModel.storeMfaVerificationCode(userId, verificationCode, expiryTime.toISOString());

            // Normally we would send an SMS here, but since this is a proof of concept,
            // we'll log the code and "pretend" it was sent
            console.log(`[MFA] Verification code for ${userId}: ${verificationCode}`);

            // In a real implementation, you would use Firebase Phone Auth or a third-party SMS service like Twilio
            // admin.auth().sendVerificationCodeToPhone(settings.phoneNumber, verificationCode);

            return {
                success: true,
                message: 'Verification code sent successfully',
                // Only return this in development/PoC, never in production!
                code: verificationCode
            };
        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to send verification code');
        }
    }

    async verifyCode(userId, code) {
        try {
            if (!code || typeof code !== 'string') {
                throw new ValidationError('Invalid verification code');
            }

            const result = await this.mfaModel.verifyMfaCode(userId, code);

            if (!result.success) {
                throw new AuthenticationError(`MFA verification failed: ${result.reason}`);
            }

            return {
                success: true,
                message: 'Code verified successfully'
            };
        } catch (error) {
            if (error instanceof ValidationError || error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError('Failed to verify MFA code');
        }
    }

    // Helper methods
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    isValidPhoneNumber(phoneNumber) {
        // Basic validation for demonstration purposes
        // In a real implementation, you would use a more robust validation method
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phoneNumber);
    }
}

module.exports = MfaService;