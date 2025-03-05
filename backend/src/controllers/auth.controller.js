const { MESSAGE_LOGIN_SUCCESSFUL, MESSAGE_REGISTRATION_SUCCESSFUL } = require('../utils/constants');
const { admin } = require('../config/firebase.config');
const { NotFoundError } = require('../utils/errors');

class AuthController {
    constructor(authService, mfaService) {
        this.authService = authService;
        this.mfaService = mfaService;
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { token, user, mfaRequired } = await this.authService.loginUser(email, password);

            // If MFA is required, return a flag indicating this
            if (mfaRequired) {
                // Send verification code
                await this.mfaService.sendVerificationCode(user.id);

                return res.json({
                    status: 'success',
                    message: 'MFA verification required',
                    data: {
                        userId: user.id,
                        mfaRequired: true
                    }
                });
            }

            res.json({
                status: 'success',
                message: MESSAGE_LOGIN_SUCCESSFUL,
                data: { token, user, mfaRequired: false }
            });
        } catch (error) {
            next(error);
        }
    }

    async verifyMfaAndLogin(req, res, next) {
        try {
            const { userId, verificationCode } = req.body;

            // Verify the MFA code
            await this.authService.validateMfa(userId, verificationCode);

            // Get the user
            const user = await this.authService.authModel.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Generate token
            const token = await admin.auth().createCustomToken(user.email);

            res.json({
                status: 'success',
                message: MESSAGE_LOGIN_SUCCESSFUL,
                data: { token, user }
            });
        } catch (error) {
            next(error);
        }
    }

    async register(req, res, next) {
        try {
            const userData = req.body;
            const user = await this.authService.registerUser(userData);

            res.status(201).json({
                status: 'success',
                message: MESSAGE_REGISTRATION_SUCCESSFUL,
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    async googleAuthCallback(req, res, next) {
        try {
            const { user } = req;
            await this.authService.googleAuth(user);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${user.token}`);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;