const express = require('express');
const request = require('supertest');
const setupTransactionRoutes = require('../../../src/routes/transaction.routes');

jest.mock('../../../src/middleware/auth.middleware');
jest.mock('../../../src/middleware/validation.middleware', () => ({
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
            addTransaction: jest.fn((req, res) => res.status(200).json({
                status: 'success',
                message: 'Transaction added successfully',
                data: {}
            })),
            getUserTransactions: jest.fn((req, res) => res.json({
                linkedBank: true,
                Transaction: []
            })),
            deleteTransaction: jest.fn((req, res) => res.status(200).json({
                status: 'success',
                message: 'Transaction deleted successfully'
            })),
            getTransactionAnalytics: jest.fn((req, res) => res.status(200).json({
                status: 'success',
                data: {}
            })),
            updateCategory: jest.fn((req, res) => res.status(200).json({
                status: 'success',
                message: 'Transaction category updated successfully',
                data: {}
            })),
            getInsights: jest.fn((req, res) => res.status(200).json({
                status: 'success',
                data: {}
            }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        mockValidationMiddleware = require('../../../src/middleware/validation.middleware');

        const router = express.Router();
        app.use('/transactions', setupTransactionRoutes(router, mockTransactionController, mockAuthMiddleware));
    });

    describe('POST /transactions/add_transaction', () => {
        const testTransaction = {
            userId: 'test-user',
            amount: 100,
            category: 'Food',
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

        it('should add transaction and return success response', async () => {
            const response = await request(app)
                .post('/transactions/add_transaction')
                .send(testTransaction);

            expect(mockTransactionController.addTransaction).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Transaction added successfully');
        });
    });

    describe('GET /transactions/user-transactions', () => {
        it('should verify authentication and return transactions', async () => {
            const response = await request(app)
                .get('/transactions/user-transactions')
                .query({ userId: 'test-user' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
            expect(mockTransactionController.getUserTransactions).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('linkedBank');
            expect(response.body).toHaveProperty('Transaction');
        });
    });

    describe('DELETE /transactions/delete_transaction/:transactionId', () => {
        it('should verify authentication and delete transaction', async () => {
            const response = await request(app)
                .delete('/transactions/delete_transaction/123')
                .send({ userId: 'test-user' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
            expect(mockTransactionController.deleteTransaction).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Transaction deleted successfully');
        });
    });

    describe('GET /transactions/analytics', () => {
        it('should verify authentication and return analytics', async () => {
            const response = await request(app)
                .get('/transactions/analytics')
                .query({ userId: 'test-user' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
            expect(mockTransactionController.getTransactionAnalytics).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
    });

    describe('POST /transactions/update-category', () => {
        const testUpdate = {
            userId: 'test-user',
            transactionId: '123',
            category: 'Food'
        };

        it('should verify authentication and update category', async () => {
            const response = await request(app)
                .post('/transactions/update-category')
                .send(testUpdate);

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
            expect(mockTransactionController.updateCategory).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('Transaction category updated successfully');
        });
    });

    describe('GET /transactions/insights', () => {
        it('should verify authentication and return insights', async () => {
            const response = await request(app)
                .get('/transactions/insights')
                .query({ userId: 'test-user' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
            expect(mockTransactionController.getInsights).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });
    });
});