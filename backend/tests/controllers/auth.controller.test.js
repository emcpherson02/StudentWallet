const AuthController = require('../../src/controllers/auth.controller');
const { MESSAGE_LOGIN_SUCCESSFUL, MESSAGE_REGISTRATION_SUCCESSFUL } = require('../../src/utils/constants');

describe('AuthController', () => {
    let authController;
    let mockAuthService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockAuthService = {
            loginUser: jest.fn(),
            registerUser: jest.fn(),
            googleAuth: jest.fn()
        };

        authController = new AuthController(mockAuthService);

        mockReq = {
            body: {},
            user: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            redirect: jest.fn()
        };

        mockNext = jest.fn();
    });

    describe('login', () => {
        it('should successfully login a user', async () => {
            const mockLoginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const mockLoginResponse = {
                token: 'mock-token',
                user: { id: '1', email: 'test@example.com' }
            };
            mockReq.body = mockLoginData;
            mockAuthService.loginUser.mockResolvedValue(mockLoginResponse);

            await authController.login(mockReq, mockRes, mockNext);

            expect(mockAuthService.loginUser).toHaveBeenCalledWith(
                mockLoginData.email,
                mockLoginData.password
            );
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: MESSAGE_LOGIN_SUCCESSFUL,
                data: mockLoginResponse
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle login errors', async () => {
            const mockError = new Error('Login failed');
            mockAuthService.loginUser.mockRejectedValue(mockError);

            await authController.login(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const mockUserData = {
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User'
            };
            const mockRegisteredUser = {
                id: '1',
                ...mockUserData
            };
            mockReq.body = mockUserData;
            mockAuthService.registerUser.mockResolvedValue(mockRegisteredUser);

            await authController.register(mockReq, mockRes, mockNext);

            expect(mockAuthService.registerUser).toHaveBeenCalledWith(mockUserData);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: MESSAGE_REGISTRATION_SUCCESSFUL,
                data: { user: mockRegisteredUser }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle registration errors', async () => {
            const mockError = new Error('Registration failed');
            mockAuthService.registerUser.mockRejectedValue(mockError);

            await authController.register(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('googleAuthCallback', () => {
        it('should successfully handle Google auth callback', async () => {
            const mockUser = {
                token: 'google-auth-token',
                profile: { email: 'google@example.com' }
            };
            mockReq.user = mockUser;
            process.env.FRONTEND_URL = 'http://localhost:3000';

            await authController.googleAuthCallback(mockReq, mockRes, mockNext);

            expect(mockAuthService.googleAuth).toHaveBeenCalledWith(mockUser);
            expect(mockRes.redirect).toHaveBeenCalledWith(
                `http://localhost:3000/auth/callback?token=${mockUser.token}`
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle Google auth callback errors', async () => {
            const mockError = new Error('Google auth failed');
            mockAuthService.googleAuth.mockRejectedValue(mockError);

            await authController.googleAuthCallback(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });
    });
});