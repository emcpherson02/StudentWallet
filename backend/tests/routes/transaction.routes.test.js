const express = require('express');
const request = require('supertest');
const setupTransactionRoutes = require('../../src/routes/transaction.routes');

jest.mock('../../src/middleware/auth.middleware');
jest.mock('../../src/middleware/validation.middleware', () => ({
    validateTransaction: jest.fn((req, res, next) => next())
}));

describe('Transaction Routes', () => {
    let app;
    let mockTransactionController;
    let mockAuthMiddleware;
    let mockValidationMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockTransactionController = {
            addTransaction: jest.fn((req, res) => res.json({ success: true })),
            getUserTransactions: jest.fn((req, res) => res.json({ transactions: [] })),
            deleteTransaction: jest.fn((req, res) => res.json({ success: true })),
            getTransactionAnalytics: jest.fn((req, res) => res.json({ analytics: {} })),
            updateCategory: jest.fn((req, res) => res.json({ success: true }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        mockValidationMiddleware = require('../../src/middleware/validation.middleware');

        const router = express.Router();
        app.use('/transactions', setupTransactionRoutes(router, mockTransactionController, mockAuthMiddleware));
    });

    describe('POST /transactions/add_transaction', () => {
        const testTransaction = {
            userId: 'test-user',
            amount: 100,
            date: '2025-02-22',
            description: 'Test transaction'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/transactions/add_transaction')
                .send(testTransaction);

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should validate transaction data', async () => {
            await request(app)
                .post('/transactions/add_transaction')
                .send(testTransaction);

            expect(mockValidationMiddleware.validateTransaction).toHaveBeenCalled();
        });

        it('should add transaction', async () => {
            await request(app)
                .post('/transactions/add_transaction')
                .send(testTransaction);

            expect(mockTransactionController.addTransaction).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/transactions/add_transaction')
                .send(testTransaction);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /transactions/user-transactions', () => {
        it('should verify authentication', async () => {
            await request(app).get('/transactions/user-transactions');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch user transactions', async () => {
            await request(app).get('/transactions/user-transactions');
            expect(mockTransactionController.getUserTransactions).toHaveBeenCalled();
        });

        it('should return transactions list', async () => {
            const response = await request(app).get('/transactions/user-transactions');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ transactions: [] });
        });
    });

    describe('DELETE /transactions/delete_transaction/:transactionId', () => {
        it('should verify authentication', async () => {
            await request(app).delete('/transactions/delete_transaction/123');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should delete transaction', async () => {
            await request(app).delete('/transactions/delete_transaction/123');
            expect(mockTransactionController.deleteTransaction).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).delete('/transactions/delete_transaction/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /transactions/analytics', () => {
        it('should verify authentication', async () => {
            await request(app).get('/transactions/analytics');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch analytics', async () => {
            await request(app).get('/transactions/analytics');
            expect(mockTransactionController.getTransactionAnalytics).toHaveBeenCalled();
        });

        it('should return analytics data', async () => {
            const response = await request(app).get('/transactions/analytics');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ analytics: {} });
        });
    });

    describe('POST /transactions/update-category', () => {
        const testUpdate = {
            transactionId: '123',
            category: 'Food'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/transactions/update-category')
                .send(testUpdate);
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should update category', async () => {
            await request(app)
                .post('/transactions/update-category')
                .send(testUpdate);
            expect(mockTransactionController.updateCategory).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/transactions/update-category')
                .send(testUpdate);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });
});