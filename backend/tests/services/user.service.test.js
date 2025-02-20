const UserService = require('../../src/services/user.service');
const { NotFoundError, DatabaseError } = require('../../src/utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../../src/utils/constants');
const { admin } = require('../../src/config/firebase.config');

jest.mock('../../src/config/firebase.config', () => ({
    admin: {
        auth: jest.fn().mockReturnValue({
            deleteUser: jest.fn()
        })
    }
}));

describe('UserService', () => {
    let userService;
    let mockUserModel;

    beforeEach(() => {
        mockUserModel = {
            findById: jest.fn(),
            getLinkedAccounts: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        userService = new UserService(mockUserModel);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserData', () => {
        const userId = 'test-user-id';
        const mockUserData = {
            id: userId,
            name: 'Test User',
            email: 'test@example.com',
            linkedBank: true
        };
        const mockAccounts = [
            { type: 'checking', balance: 1000 },
            { type: 'savings', balance: 5000 }
        ];

        it('should return user data with linked accounts when bank is connected', async () => {
            mockUserModel.findById.mockResolvedValue(mockUserData);
            mockUserModel.getLinkedAccounts.mockResolvedValue(mockAccounts);

            const result = await userService.getUserData(userId);

            expect(result).toEqual({
                linkedBank: true,
                accounts: mockAccounts
            });
            expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
            expect(mockUserModel.getLinkedAccounts).toHaveBeenCalledWith(userId);
        });

        it('should return only linkedBank status when bank is not connected', async () => {
            mockUserModel.findById.mockResolvedValue({
                ...mockUserData,
                linkedBank: false
            });

            const result = await userService.getUserData(userId);

            expect(result).toEqual({ linkedBank: false });
            expect(mockUserModel.getLinkedAccounts).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            await expect(userService.getUserData(userId))
                .rejects
                .toThrow(NotFoundError);
            expect(mockUserModel.getLinkedAccounts).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when database operation fails', async () => {
            mockUserModel.findById.mockRejectedValue(new Error('Database connection failed'));

            await expect(userService.getUserData(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('updateUser', () => {
        const userId = 'test-user-id';
        const updates = {
            name: 'Updated Name',
            email: 'updated@example.com'
        };

        it('should successfully update user details', async () => {
            const updatedUser = { id: userId, ...updates };
            mockUserModel.update.mockResolvedValue(updatedUser);

            const result = await userService.updateUser(userId, updates);

            expect(result).toEqual(updatedUser);
            expect(mockUserModel.update).toHaveBeenCalledWith(userId, updates);
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockUserModel.update.mockResolvedValue(null);

            await expect(userService.updateUser(userId, updates))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when update operation fails', async () => {
            mockUserModel.update.mockRejectedValue(new Error('Update failed'));

            await expect(userService.updateUser(userId, updates))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteUser', () => {
        const userId = 'test-user-id';

        it('should successfully delete user and their Firebase account', async () => {
            mockUserModel.delete.mockResolvedValue(true);
            admin.auth().deleteUser.mockResolvedValue();

            const result = await userService.deleteUser(userId);

            expect(result).toEqual({
                success: true,
                message: 'User and associated data deleted successfully'
            });
            expect(mockUserModel.delete).toHaveBeenCalledWith(userId);
            expect(admin.auth().deleteUser).toHaveBeenCalledWith(userId);
        });

        it('should throw DatabaseError when user does not exist', async () => {
            mockUserModel.delete.mockResolvedValue(false);

            await expect(userService.deleteUser(userId))
                .rejects
                .toThrow(DatabaseError);
            expect(admin.auth().deleteUser).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when delete operation fails', async () => {
            mockUserModel.delete.mockRejectedValue(new Error('Delete failed'));

            await expect(userService.deleteUser(userId))
                .rejects
                .toThrow(DatabaseError);
            expect(admin.auth().deleteUser).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when Firebase deletion fails', async () => {
            mockUserModel.delete.mockResolvedValue(true);
            admin.auth().deleteUser.mockRejectedValue(new Error('Firebase deletion failed'));

            await expect(userService.deleteUser(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });
});