const { AuthenticationError } = require('../utils/errors');
const { MESSAGE_UNAUTHORIZED } = require('../utils/constants');

class AuthMiddleware {
    constructor(authService) {
        this.authService = authService;
    }

    verifyToken = async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                throw new AuthenticationError(MESSAGE_UNAUTHORIZED);
            }

            const decodedToken = await this.authService.validateToken(token);
            req.user = decodedToken;
            next();
        } catch (error) {
            next(new AuthenticationError(MESSAGE_UNAUTHORIZED));
        }
    }
}

module.exports = AuthMiddleware;