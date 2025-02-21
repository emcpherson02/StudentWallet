const UserService = require('../../../src/services/user.service');
const { NotFoundError, DatabaseError, ValidationError } = require('../../../src/utils/errors');
const { MESSAGE_USER_NOT_FOUND } = require('../../../src/utils/constants');
const { admin } = require('../../../src/config/firebase.config');

jest.mock('../../../src/config/firebase.config', () => ({
    admin: {
        auth: jest.fn().mockReturnValue({
            deleteUser: jest.fn()
        })
    }
}));

describe('UserService', () => {
    let userService;
    let mockUserModel;
    let mockBudgetModel;
    let mockBudgetNotificationService;

    beforeEach(() => {
        mockUserModel = {
            findById: jest.fn(),
            getLinkedAccounts: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addCategory: jest.fn(),
            getCategories: jest.fn(),
            deleteCategory: jest.fn(),
            getNotificationHistory: jest.fn()
        };

        userService = new UserService(mockUserModel, mockBudgetModel, mockBudgetNotificationService);
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
            linkedBank: true,
            notificationsEnabled: true
        };

        it('should return user data with linkedBank and notifications status', async () => {
            mockUserModel.findById.mockResolvedValue(mockUserData);

            const result = await userService.getUserData(userId);

            expect(result).toEqual({
                linkedBank: true,
                notificationsEnabled: true
            });
            expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
        });

        it('should return default values when optional fields are missing', async () => {
            mockUserModel.findById.mockResolvedValue({
                id: userId,
                name: 'Test User'
            });

            const result = await userService.getUserData(userId);

            expect(result).toEqual({
                linkedBank: false,
                notificationsEnabled: false
            });
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            await expect(userService.getUserData(userId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when database operation fails', async () => {
            mockUserModel.findById.mockRejectedValue(new Error('Database connection failed'));

            await expect(userService.getUserData(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('toggleNotifications', () => {
        const userId = 'test-user-id';

        it('should successfully toggle notifications on', async () => {
            mockUserModel.update.mockResolvedValue({ notificationsEnabled: true });

            const result = await userService.toggleNotifications(userId, true);

            expect(result).toEqual({ notificationsEnabled: true });
            expect(mockUserModel.update).toHaveBeenCalledWith(userId, { notificationsEnabled: true });
        });

        it('should successfully toggle notifications off', async () => {
            mockUserModel.update.mockResolvedValue({ notificationsEnabled: false });

            const result = await userService.toggleNotifications(userId, false);

            expect(result).toEqual({ notificationsEnabled: false });
            expect(mockUserModel.update).toHaveBeenCalledWith(userId, { notificationsEnabled: false });
        });

        it('should throw ValidationError when userId is missing', async () => {
            await expect(userService.toggleNotifications(null, true))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockUserModel.update.mockResolvedValue(null);

            await expect(userService.toggleNotifications(userId, true))
                .rejects
                .toThrow(NotFoundError);
        });
    });

    describe('category management', () => {
        const userId = 'test-user-id';
        const category = 'New Category';

        describe('addCategory', () => {
            it('should successfully add a category', async () => {
                mockUserModel.addCategory.mockResolvedValue(category);

                const result = await userService.addCategory(userId, category);

                expect(result).toBe(category);
                expect(mockUserModel.addCategory).toHaveBeenCalledWith(userId, category);
            });

            it('should throw ValidationError when params are missing', async () => {
                await expect(userService.addCategory(null, category))
                    .rejects
                    .toThrow(ValidationError);
            });
        });

        describe('getCategories', () => {
            it('should successfully retrieve categories', async () => {
                const mockCategories = ['Category 1', 'Category 2'];
                mockUserModel.getCategories.mockResolvedValue(mockCategories);

                const result = await userService.getCategories(userId);

                expect(result).toEqual(mockCategories);
                expect(mockUserModel.getCategories).toHaveBeenCalledWith(userId);
            });

            it('should throw ValidationError when userId is missing', async () => {
                await expect(userService.getCategories(null))
                    .rejects
                    .toThrow(ValidationError);
            });
        });

        describe('deleteCategory', () => {
            it('should successfully delete a category', async () => {
                mockUserModel.deleteCategory.mockResolvedValue(true);

                const result = await userService.deleteCategory(userId, category);

                expect(result).toBe(true);
                expect(mockUserModel.deleteCategory).toHaveBeenCalledWith(userId, category);
            });

            it('should throw ValidationError when params are missing', async () => {
                await expect(userService.deleteCategory(null, category))
                    .rejects
                    .toThrow(ValidationError);
            });
        });
    });

    describe('getNotificationHistory', () => {
        const userId = 'test-user-id';

        it('should successfully retrieve notification history', async () => {
            const mockHistory = [
                { id: 1, message: 'Test notification' }
            ];
            mockUserModel.getNotificationHistory.mockResolvedValue(mockHistory);

            const result = await userService.getNotificationHistory(userId);

            expect(result).toEqual(mockHistory);
            expect(mockUserModel.getNotificationHistory).toHaveBeenCalledWith(userId);
        });

        it('should throw DatabaseError when retrieval fails', async () => {
            mockUserModel.getNotificationHistory.mockRejectedValue(new Error('Retrieval failed'));

            await expect(userService.getNotificationHistory(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    // Keep existing updateUser and deleteUser tests
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