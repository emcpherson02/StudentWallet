const UserController = require('../../../src/controllers/user.controller');

describe('UserController', () => {
    let userController;
    let mockUserService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockUserService = {
            getUserData: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            toggleNotifications: jest.fn(),
            getNotificationHistory: jest.fn(),
            addCategory: jest.fn(),
            getCategories: jest.fn(),
            deleteCategory: jest.fn()
        };

        userController = new UserController(mockUserService);

        mockReq = {
            body: {},
            query: {},
            params: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('getUserData', () => {
        it('should successfully get user data', async () => {
            const userId = '123';
            const mockUserData = {
                id: userId,
                name: 'John Doe',
                email: 'john@example.com'
            };
            
            mockReq.query = { userId };
            mockUserService.getUserData.mockResolvedValue(mockUserData);

            await userController.getUserData(mockReq, mockRes, mockNext);

            expect(mockUserService.getUserData).toHaveBeenCalledWith(userId);
            expect(mockRes.json).toHaveBeenCalledWith(mockUserData);
        });

        it('should handle missing userId parameter', async () => {
            await userController.getUserData(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Missing userId parameter'
            });
            expect(mockUserService.getUserData).not.toHaveBeenCalled();
        });

        it('should handle errors when getting user data', async () => {
            const mockError = new Error('Failed to get user data');
            mockReq.query = { userId: '123' };
            mockUserService.getUserData.mockRejectedValue(mockError);

            await userController.getUserData(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('updateUser', () => {
        it('should successfully update user details', async () => {
            const mockUpdateData = {
                userId: '123',
                updates: {
                    name: 'Jane Doe',
                    email: 'jane@example.com'
                }
            };
            const mockUpdatedUser = { id: mockUpdateData.userId, ...mockUpdateData.updates };
            
            mockReq.params = { userId: mockUpdateData.userId };
            mockReq.body = mockUpdateData.updates;
            mockUserService.updateUser.mockResolvedValue(mockUpdatedUser);

            await userController.updateUser(mockReq, mockRes, mockNext);

            expect(mockUserService.updateUser).toHaveBeenCalledWith(
                mockUpdateData.userId,
                mockUpdateData.updates
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'User details updated successfully',
                data: mockUpdatedUser
            });
        });

        it('should handle errors when updating user', async () => {
            const mockError = new Error('Failed to update user');
            mockUserService.updateUser.mockRejectedValue(mockError);

            await userController.updateUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('deleteUser', () => {
        it('should successfully delete user', async () => {
            const userId = '123';
            mockReq.params = { userId };
            mockUserService.deleteUser.mockResolvedValue(true);

            await userController.deleteUser(mockReq, mockRes, mockNext);

            expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'User deleted successfully'
            });
        });

        it('should handle errors when deleting user', async () => {
            const mockError = new Error('Failed to delete user');
            mockUserService.deleteUser.mockRejectedValue(mockError);

            await userController.deleteUser(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('toggleNotifications', () => {
        it('should successfully toggle notifications', async () => {
            const mockData = {
                userId: '123',
                enabled: true
            };
            const mockResult = { 
                id: mockData.userId,
                notificationsEnabled: mockData.enabled
            };
            
            mockReq.body = mockData;
            mockUserService.toggleNotifications.mockResolvedValue(mockResult);

            await userController.toggleNotifications(mockReq, mockRes, mockNext);

            expect(mockUserService.toggleNotifications).toHaveBeenCalledWith(
                mockData.userId,
                mockData.enabled
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockResult
            });
        });
    });

    describe('getNotificationHistory', () => {
        it('should successfully get notification history', async () => {
            const userId = '123';
            const mockNotifications = [
                { id: '1', message: 'Budget alert', date: '2024-02-22' },
                { id: '2', message: 'Spending alert', date: '2024-02-21' }
            ];
            
            mockReq.query = { userId };
            mockUserService.getNotificationHistory.mockResolvedValue(mockNotifications);

            await userController.getNotificationHistory(mockReq, mockRes, mockNext);

            expect(mockUserService.getNotificationHistory).toHaveBeenCalledWith(userId);
            expect(mockRes.json).toHaveBeenCalledWith({ notifications: mockNotifications });
        });
    });

    describe('addCategory', () => {
        it('should successfully add a category', async () => {
            const mockData = {
                userId: '123',
                category: 'Entertainment'
            };
            const mockNewCategory = mockData.category;
            
            mockReq.body = mockData;
            mockUserService.addCategory.mockResolvedValue(mockNewCategory);

            await userController.addCategory(mockReq, mockRes, mockNext);

            expect(mockUserService.addCategory).toHaveBeenCalledWith(
                mockData.userId,
                mockData.category
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Category added successfully',
                data: mockNewCategory
            });
        });
    });

    describe('getCategories', () => {
        it('should successfully get categories', async () => {
            const userId = '123';
            const mockCategories = ['Food', 'Transport', 'Entertainment'];
            
            mockReq.query = { userId };
            mockUserService.getCategories.mockResolvedValue(mockCategories);

            await userController.getCategories(mockReq, mockRes, mockNext);

            expect(mockUserService.getCategories).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockCategories
            });
        });
    });

    describe('deleteCategory', () => {
        it('should successfully delete a category', async () => {
            const mockData = {
                userId: '123',
                category: 'Entertainment'
            };
            
            mockReq.body = { userId: mockData.userId };
            mockReq.params = { category: mockData.category };
            mockUserService.deleteCategory.mockResolvedValue(true);

            await userController.deleteCategory(mockReq, mockRes, mockNext);

            expect(mockUserService.deleteCategory).toHaveBeenCalledWith(
                mockData.userId,
                mockData.category
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Category deleted successfully'
            });
        });
    });
});