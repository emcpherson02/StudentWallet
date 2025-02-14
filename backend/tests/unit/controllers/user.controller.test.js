const request = require('supertest');
const express = require('express');
const UserController = require('../controllers/UserController');

describe('UserController', () => {
    let app, userServiceMock, userController;

    beforeEach(() => {
        userServiceMock = {
            getUserData: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            toggleNotifications: jest.fn()
        };
        userController = new UserController(userServiceMock);
        app = express();
        app.use(express.json());
        app.get('/user', (req, res, next) => userController.getUserData(req, res, next));
        app.put('/user/:userId', (req, res, next) => userController.updateUser(req, res, next));
        app.delete('/user/:userId', (req, res, next) => userController.deleteUser(req, res, next));
        app.post('/user/notifications', (req, res, next) => userController.toggleNotifications(req, res, next));
    });

    test('should return user data for a valid userId', async () => {
        userServiceMock.getUserData.mockResolvedValue({ id: '123', name: 'John Doe' });
        const response = await request(app).get('/user?userId=123');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: '123', name: 'John Doe' });
    });

    test('should return 400 if userId is missing in getUserData', async () => {
        const response = await request(app).get('/user');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Missing userId parameter' });
    });

    test('should update user details', async () => {
        userServiceMock.updateUser.mockResolvedValue({ id: '123', name: 'Updated Name' });
        const response = await request(app).put('/user/123').send({ name: 'Updated Name' });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'success',
            message: 'User details updated successfully',
            data: { id: '123', name: 'Updated Name' }
        });
    });

    test('should delete user', async () => {
        userServiceMock.deleteUser.mockResolvedValue();
        const response = await request(app).delete('/user/123');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'User deleted successfully' });
    });

    test('should toggle notifications', async () => {
        userServiceMock.toggleNotifications.mockResolvedValue({ notificationsEnabled: true });
        const response = await request(app).post('/user/notifications').send({ userId: '123', enabled: true });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: { notificationsEnabled: true } });
    });
});
