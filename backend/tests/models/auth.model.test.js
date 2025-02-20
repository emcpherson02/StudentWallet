const AuthModel = require('../../src/models/auth.model');

jest.mock('../../src/config/firebase.config', () => ({
    admin: {
        firestore: {
            FieldValue: {
                serverTimestamp: jest.fn().mockReturnValue('mocked-timestamp')
            }
        }
    }
}));

describe('AuthModel', () => {
    let authModel;
    let mockDb;
    let mockAdmin;
    let mockCollection;
    let mockDoc;
    let mockGet;
    let mockSet;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAdmin = {
            firestore: {
                FieldValue: {
                    serverTimestamp: jest.fn().mockReturnValue('mocked-timestamp')
                }
            }
        };

        mockGet = jest.fn();
        mockSet = jest.fn();
        mockDoc = jest.fn().mockReturnValue({
            get: mockGet,
            set: mockSet
        });
        mockCollection = jest.fn().mockReturnValue({
            doc: mockDoc
        });
        mockDb = {
            collection: mockCollection
        };

        authModel = new AuthModel(mockDb, mockAdmin);
    });

    describe('findByEmail', () => {
        it('should return null when user does not exist', async () => {
            const email = 'nonexistent@example.com';
            mockGet.mockResolvedValue({ exists: false });

            const result = await authModel.findByEmail(email);

            expect(result).toBeNull();
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith(email);
            expect(mockGet).toHaveBeenCalled();
        });

        it('should return user data when user exists', async () => {
            const email = 'test@example.com';
            const mockUserData = {
                exists: true,
                id: email,
                data: () => ({
                    name: 'Test User',
                    email: email
                })
            };
            mockGet.mockResolvedValue(mockUserData);

            const result = await authModel.findByEmail(email);

            expect(result).toEqual({
                id: email,
                name: 'Test User',
                email: email
            });
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith(email);
        });

        it('should handle errors during user lookup', async () => {
            const email = 'test@example.com';
            mockGet.mockRejectedValue(new Error('Database error'));

            await expect(authModel.findByEmail(email))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('createUser', () => {
        it('should create a new user with correct default values', async () => {
            const email = 'new@example.com';
            const userData = {
                name: 'New User',
                email: email
            };
            mockSet.mockResolvedValue(undefined);

            const result = await authModel.createUser(email, userData);

            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith(email);
            expect(mockSet).toHaveBeenCalledWith({
                ...userData,
                linkedBank: false,
                notificationsEnabled: false,
                createdAt: 'mocked-timestamp'
            });
            expect(result).toEqual({
                id: email,
                ...userData
            });
        });

        it('should handle errors during user creation', async () => {
            const email = 'test@example.com';
            mockSet.mockRejectedValue(new Error('Creation failed'));

            await expect(authModel.createUser(email, {}))
                .rejects
                .toThrow('Creation failed');
        });
    });

    describe('createOrUpdateGoogleUser', () => {
        it('should create or update a Google user with correct data', async () => {
            const mockProfile = {
                id: 'google123',
                displayName: 'Google User',
                emails: [{ value: 'google@example.com' }],
                photos: [{ value: 'photo-url' }]
            };
            mockSet.mockResolvedValue(undefined);

            const result = await authModel.createOrUpdateGoogleUser(mockProfile);

            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith(mockProfile.id);
            expect(mockSet).toHaveBeenCalledWith({
                id: mockProfile.id,
                displayName: mockProfile.displayName,
                email: 'google@example.com',
                photoURL: 'photo-url',
                linkedBank: false,
                notificationsEnabled: false,
                createdAt: 'mocked-timestamp'
            }, { merge: true });
            expect(result).toMatchObject({
                id: mockProfile.id,
                displayName: mockProfile.displayName,
                email: 'google@example.com',
                photoURL: 'photo-url'
            });
        });

        it('should handle missing profile fields', async () => {
            const mockProfile = {
                id: 'google123',
                displayName: 'Google User',
                emails: [],
                photos: []
            };
            mockSet.mockResolvedValue(undefined);

            await expect(authModel.createOrUpdateGoogleUser(mockProfile))
                .rejects
                .toThrow(TypeError);
        });

        it('should handle errors during Google user creation/update', async () => {
            const mockProfile = {
                id: 'google123',
                displayName: 'Google User',
                emails: [{ value: 'google@example.com' }],
                photos: [{ value: 'photo-url' }]
            };
            mockSet.mockRejectedValue(new Error('Google auth failed'));

            await expect(authModel.createOrUpdateGoogleUser(mockProfile))
                .rejects
                .toThrow('Google auth failed');
        });

        it('should handle undefined profile', async () => {
            await expect(authModel.createOrUpdateGoogleUser(undefined))
                .rejects
                .toThrow(TypeError);
        });
    });
});