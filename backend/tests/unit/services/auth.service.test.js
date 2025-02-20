const AuthService = require('../../../src/services/auth.service');
const { AuthenticationError, DatabaseError } = require('../../../src/utils/errors');
const { admin } = require('../../../src/config/firebase.config');
const {
    MESSAGE_INVALID_CREDENTIALS,
    MESSAGE_USER_EXISTS,
    MESSAGE_ERROR_OCCURRED
} = require('../../../src/utils/constants');

jest.mock('../../../src/config/firebase.config', () => ({
    admin: {
        auth: jest.fn().mockReturnValue({
            createCustomToken: jest.fn(),
            createUser: jest.fn(),
            verifyIdToken: jest.fn()
        })
    }
}));

describe('AuthService', () => {
    let authService;
    let mockAuthModel;

    beforeEach(() => {
        mockAuthModel = {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            createOrUpdateGoogleUser: jest.fn()
        };
        authService = new AuthService(mockAuthModel);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('loginUser', () => {
        const email = 'test@example.com';
        const password = 'password123';
        const mockUser = {
            email,
            password,
            name: 'Test User'
        };
        const mockToken = 'mock-firebase-token';

        it('should successfully login user with valid credentials', async () => {
            mockAuthModel.findByEmail.mockResolvedValue(mockUser);
            admin.auth().createCustomToken.mockResolvedValue(mockToken);

            const result = await authService.loginUser(email, password);

            expect(result).toEqual({
                token: mockToken,
                user: mockUser
            });
            expect(mockAuthModel.findByEmail).toHaveBeenCalledWith(email);
            expect(admin.auth().createCustomToken).toHaveBeenCalledWith(email);
        });

        it('should throw AuthenticationError for non-existent user', async () => {
            mockAuthModel.findByEmail.mockResolvedValue(null);

            await expect(authService.loginUser(email, password))
                .rejects
                .toThrow(AuthenticationError);
            expect(mockAuthModel.findByEmail).toHaveBeenCalledWith(email);
            expect(admin.auth().createCustomToken).not.toHaveBeenCalled();
        });

        it('should throw AuthenticationError for incorrect password', async () => {
            mockAuthModel.findByEmail.mockResolvedValue(mockUser);

            await expect(authService.loginUser(email, 'wrongpassword'))
                .rejects
                .toThrow(AuthenticationError);
            expect(mockAuthModel.findByEmail).toHaveBeenCalledWith(email);
            expect(admin.auth().createCustomToken).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when database operation fails', async () => {
            mockAuthModel.findByEmail.mockRejectedValue(new Error('Database error'));

            await expect(authService.loginUser(email, password))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('registerUser', () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            dob: '1990-01-01'
        };

        it('should successfully register new user', async () => {
            mockAuthModel.findByEmail.mockResolvedValue(null);
            const mockFirebaseUser = {
                uid: 'firebase-uid',
                email: userData.email,
                displayName: userData.name
            };
            admin.auth().createUser.mockResolvedValue(mockFirebaseUser);
            mockAuthModel.createUser.mockResolvedValue({ ...userData, id: mockFirebaseUser.uid });

            const result = await authService.registerUser(userData);

            expect(result).toEqual(mockFirebaseUser);
            expect(mockAuthModel.findByEmail).toHaveBeenCalledWith(userData.email);
            expect(admin.auth().createUser).toHaveBeenCalledWith({
                email: userData.email,
                password: userData.password,
                displayName: userData.name
            });
        });

        it('should throw AuthenticationError if user already exists', async () => {
            mockAuthModel.findByEmail.mockResolvedValue({ email: userData.email });

            await expect(authService.registerUser(userData))
                .rejects
                .toThrow(AuthenticationError);
            expect(admin.auth().createUser).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when registration fails', async () => {
            mockAuthModel.findByEmail.mockResolvedValue(null);
            admin.auth().createUser.mockRejectedValue(new Error('Firebase error'));

            await expect(authService.registerUser(userData))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('googleAuth', () => {
        const mockProfile = {
            id: 'google-id',
            displayName: 'Google User',
            emails: [{ value: 'google@example.com' }],
            photos: [{ value: 'photo-url' }]
        };

        it('should successfully authenticate Google user', async () => {
            const mockUser = {
                id: mockProfile.id,
                name: mockProfile.displayName,
                email: mockProfile.emails[0].value
            };
            mockAuthModel.createOrUpdateGoogleUser.mockResolvedValue(mockUser);

            const result = await authService.googleAuth(mockProfile);

            expect(result).toEqual(mockUser);
            expect(mockAuthModel.createOrUpdateGoogleUser).toHaveBeenCalledWith(mockProfile);
        });

        it('should throw DatabaseError when Google auth fails', async () => {
            mockAuthModel.createOrUpdateGoogleUser.mockRejectedValue(new Error('Database error'));

            await expect(authService.googleAuth(mockProfile))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('validateToken', () => {
        const mockToken = 'valid-token';
        const mockDecodedToken = {
            uid: 'user-id',
            email: 'test@example.com'
        };

        it('should successfully validate token', async () => {
            admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

            const result = await authService.validateToken(mockToken);

            expect(result).toEqual(mockDecodedToken);
            expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(mockToken);
        });

        it('should throw AuthenticationError for invalid token', async () => {
            admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

            await expect(authService.validateToken(mockToken))
                .rejects
                .toThrow(AuthenticationError);
        });
    });
});