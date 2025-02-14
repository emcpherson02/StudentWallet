const request = require('supertest');
const express = require('express');
const AuthController = require('../controllers/AuthController');
const { MESSAGE_LOGIN_SUCCESSFUL, MESSAGE_REGISTRATION_SUCCESSFUL } = require('../utils/constants');

// Mock AuthService
const mockAuthService = {
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    googleAuth: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize AuthController with mock service
const authController = new AuthController(mockAuthService);

// Mock routes
app.post('/login', (req, res, next) => authController.login(req, res, next));
app.post('/register', (req, res, next) => authController.register(req, res, next));
app.get('/google/callback', (req, res, next) => authController.googleAuthCallback(req, res, next));

describe('AuthController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('login should return success message and token', async () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        const mockToken = 'mockToken123';
        mockAuthService.loginUser.mockResolvedValue({ token: mockToken, user: mockUser });

        const response = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'success',
            message: MESSAGE_LOGIN_SUCCESSFUL,
            data: { token: mockToken, user: mockUser }
        });
        expect(mockAuthService.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    test('register should return success message and user data', async () => {
        const mockUser = { id: 2, email: 'newuser@example.com' };
        mockAuthService.registerUser.mockResolvedValue(mockUser);

        const response = await request(app)
            .post('/register')
            .send({ email: 'newuser@example.com', password: 'securepassword' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            status: 'success',
            message: MESSAGE_REGISTRATION_SUCCESSFUL,
            data: { user: mockUser }
        });
        expect(mockAuthService.registerUser).toHaveBeenCalledWith({ email: 'newuser@example.com', password: 'securepassword' });
    });

    test('googleAuthCallback should redirect with token', async () => {
        const mockUser = { id: 3, email: 'googleuser@example.com', token: 'googleAuthToken123' };
        mockAuthService.googleAuth.mockResolvedValue();

        const response = await request(app)
            .get('/google/callback')
            .set('Accept', 'application/json')
            .set('user', JSON.stringify(mockUser));

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/auth/callback?token=googleAuthToken123`);
        expect(mockAuthService.googleAuth).toHaveBeenCalledWith(mockUser);
    });
});