const { MESSAGE_LOGIN_SUCCESSFUL, MESSAGE_REGISTRATION_SUCCESSFUL } = require('../utils/constants');

class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { token, user } = await this.authService.loginUser(email, password);

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