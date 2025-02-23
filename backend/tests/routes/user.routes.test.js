const express = require('express');
const request = require('supertest');
const setupUserRoutes = require('../../src/routes/user.routes');

jest.mock('../../src/middleware/auth.middleware');
jest.mock('../../src/middleware/validation.middleware', () => ({
    validateUserUpdate: jest.fn((req, res, next) => next())
}));

describe('User Routes', () => {
    let app;
    let mockUserController;
    let mockAuthMiddleware;
    let mockValidationMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockUserController = {
            getUserData: jest.fn((req, res) => res.json({ user: {} })),
            updateUser: jest.fn((req, res) => res.json({ success: true })),
            toggleNotifications: jest.fn((req, res) => res.json({ enabled: true })),
            deleteUser: jest.fn((req, res) => res.json({ success: true })),
            addCategory: jest.fn((req, res) => res.json({ success: true })),
            getCategories: jest.fn((req, res) => res.json({ categories: [] })),
            deleteCategory: jest.fn((req, res) => res.json({ success: true })),
            getNotificationHistory: jest.fn((req, res) => res.json({ notifications: [] }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        mockValidationMiddleware = require('../../src/middleware/validation.middleware');

        const router = express.Router();
        app.use('/user', setupUserRoutes(router, mockUserController, mockAuthMiddleware));
    });

    describe('GET /user/user-data', () => {
        it('should verify authentication', async () => {
            await request(app).get('/user/user-data');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch user data', async () => {
            await request(app).get('/user/user-data');
            expect(mockUserController.getUserData).toHaveBeenCalled();
        });

        it('should return user data', async () => {
            const response = await request(app).get('/user/user-data');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ user: {} });
        });
    });

    describe('PUT /user/update_user/:userId', () => {
        const testUpdate = {
            name: 'Test User',
            email: 'test@example.com'
        };

        it('should verify authentication', async () => {
            await request(app)
                .put('/user/update_user/123')
                .send(testUpdate);
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should validate update data', async () => {
            await request(app)
                .put('/user/update_user/123')
                .send(testUpdate);
            expect(mockValidationMiddleware.validateUserUpdate).toHaveBeenCalled();
        });

        it('should update user', async () => {
            await request(app)
                .put('/user/update_user/123')
                .send(testUpdate);
            expect(mockUserController.updateUser).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .put('/user/update_user/123')
                .send(testUpdate);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('POST /user/toggle-notifications', () => {
        it('should verify authentication', async () => {
            await request(app).post('/user/toggle-notifications');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should toggle notifications', async () => {
            await request(app).post('/user/toggle-notifications');
            expect(mockUserController.toggleNotifications).toHaveBeenCalled();
        });

        it('should return toggle status', async () => {
            const response = await request(app).post('/user/toggle-notifications');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ enabled: true });
        });
    });

    describe('DELETE /user/delete_user/:userId', () => {
        it('should delete user', async () => {
            await request(app).delete('/user/delete_user/123');
            expect(mockUserController.deleteUser).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).delete('/user/delete_user/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('POST /user/categories/add', () => {
        const testCategory = {
            name: 'Test Category'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/user/categories/add')
                .send(testCategory);
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should add category', async () => {
            await request(app)
                .post('/user/categories/add')
                .send(testCategory);
            expect(mockUserController.addCategory).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/user/categories/add')
                .send(testCategory);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /user/categories', () => {
        it('should verify authentication', async () => {
            await request(app).get('/user/categories');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch categories', async () => {
            await request(app).get('/user/categories');
            expect(mockUserController.getCategories).toHaveBeenCalled();
        });

        it('should return categories list', async () => {
            const response = await request(app).get('/user/categories');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ categories: [] });
        });
    });

    describe('DELETE /user/categories/:category', () => {
        it('should verify authentication', async () => {
            await request(app).delete('/user/categories/TestCategory');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should delete category', async () => {
            await request(app).delete('/user/categories/TestCategory');
            expect(mockUserController.deleteCategory).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).delete('/user/categories/TestCategory');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /user/notification-history', () => {
        it('should verify authentication', async () => {
            await request(app).get('/user/notification-history');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch notification history', async () => {
            await request(app).get('/user/notification-history');
            expect(mockUserController.getNotificationHistory).toHaveBeenCalled();
        });

        it('should return notifications list', async () => {
            const response = await request(app).get('/user/notification-history');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ notifications: [] });
        });
    });
});