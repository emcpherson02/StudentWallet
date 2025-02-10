const { AuthenticationError } = require('../../src/utils/errors');
const { MESSAGE_UNAUTHORIZED } = require('../../src/utils/constants');
const AuthMiddleware = require('../../src/middleware/auth.middleware');

jest.mock('../../src/utils/errors', () => ({
    AuthenticationError: jest.fn()
}));

jest.mock('../../src/utils/constants', () => ({
    MESSAGE_UNAUTHORIZED: 'Unauthorized access'
}));

jest.mock('../../src/config/firebase.config', () => ({
    admin: {
        auth: jest.fn().mockReturnValue({
            verifyIdToken: jest.fn()
        })
    }
}));

describe('AuthMiddleware', () => {
    let authMiddleware;
    let mockAuthService;
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAuthService = {
            validateToken: jest.fn()
        };

        authMiddleware = new AuthMiddleware(mockAuthService);

        mockRequest = {
            headers: {},
            session: {} 
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            redirect: jest.fn()
        };

        mockNext = jest.fn();

        AuthenticationError.mockImplementation((message) => {
            return {
                message,
                name: 'AuthenticationError',
                statusCode: 401,
                status: 'fail'
            };
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('verifyToken', () => {
        it('should throw AuthenticationError when no authorization header is present', async () => {
            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
            expect(mockAuthService.validateToken).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError when authorization header is malformed', async () => {
            mockRequest.headers.authorization = 'InvalidFormat';

            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
            expect(mockAuthService.validateToken).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError when token validation fails', async () => {
            mockRequest.headers.authorization = 'Bearer invalid-token';
            mockAuthService.validateToken.mockRejectedValue(new Error('Token validation failed'));

            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid-token');
            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
        });

        it('should successfully validate token and set user in request', async () => {
            const mockDecodedToken = { 
                uid: 'user-123', 
                email: 'test@example.com',
                auth_time: Date.now()
            };
            mockRequest.headers.authorization = 'Bearer valid-token';
            mockAuthService.validateToken.mockResolvedValue(mockDecodedToken);

            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
            expect(mockRequest.user).toEqual(mockDecodedToken);
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        it('should handle expired token correctly', async () => {
            mockRequest.headers.authorization = 'Bearer expired-token';
            mockAuthService.validateToken.mockRejectedValue(new Error('Token has expired'));

            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(mockAuthService.validateToken).toHaveBeenCalledWith('expired-token');
            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
        });

        it('should handle revoked token correctly', async () => {
            mockRequest.headers.authorization = 'Bearer revoked-token';
            mockAuthService.validateToken.mockRejectedValue(new Error('Token has been revoked'));

            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            expect(mockAuthService.validateToken).toHaveBeenCalledWith('revoked-token');
            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
        });

        it('should handle empty bearer token', async () => {
            // Arrange
            mockRequest.headers.authorization = 'Bearer ';

            // Act
            await authMiddleware.verifyToken(mockRequest, mockResponse, mockNext);

            // Assert
            expect(AuthenticationError).toHaveBeenCalledWith(MESSAGE_UNAUTHORIZED);
            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: MESSAGE_UNAUTHORIZED,
                    name: 'AuthenticationError'
                })
            );
            expect(mockAuthService.validateToken).not.toHaveBeenCalled();
        });
    });
});