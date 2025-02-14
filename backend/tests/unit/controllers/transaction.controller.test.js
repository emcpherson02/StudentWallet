const request = require('supertest');
const express = require('express');
const TransactionController = require('../controllers/TransactionController');

// Mock TransactionService
const mockTransactionService = {
    addTransaction: jest.fn(),
    getUserTransactions: jest.fn(),
    deleteTransaction: jest.fn(),
    getTransactionAnalytics: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize TransactionController with mock service
const transactionController = new TransactionController(mockTransactionService);

// Mock routes
app.post('/transaction/add', (req, res, next) => transactionController.addTransaction(req, res, next));
app.get('/transaction/user', (req, res, next) => transactionController.getUserTransactions(req, res, next));
app.delete('/transaction/:transactionId', (req, res, next) => transactionController.deleteTransaction(req, res, next));
app.get('/transaction/analytics', (req, res, next) => transactionController.getTransactionAnalytics(req, res, next));

describe('TransactionController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('addTransaction should return success message and transaction data', async () => {
        const mockTransaction = { id: 'txn_1', amount: 100, category: 'Food' };
        mockTransactionService.addTransaction.mockResolvedValue(mockTransaction);

        const response = await request(app)
            .post('/transaction/add')
            .send({ userId: 1, amount: 100, category: 'Food', date: '2024-01-01', description: 'Lunch' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'success',
            message: 'Transaction added successfully',
            data: mockTransaction
        });
        expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(1, { amount: 100, category: 'Food', date: '2024-01-01', description: 'Lunch' });
    });

    test('getUserTransactions should return user transactions', async () => {
        const mockTransactions = [{ id: 'txn_1', amount: 100 }];
        mockTransactionService.getUserTransactions.mockResolvedValue(mockTransactions);

        const response = await request(app).get('/transaction/user').query({ userId: '1' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ linkedBank: true, Transaction: mockTransactions });
        expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('1');
    });

    test('deleteTransaction should return success message', async () => {
        mockTransactionService.deleteTransaction.mockResolvedValue();

        const response = await request(app)
            .delete('/transaction/txn_1')
            .send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'success',
            message: 'Transaction deleted successfully'
        });
        expect(mockTransactionService.deleteTransaction).toHaveBeenCalledWith(1, 'txn_1');
    });

    test('getTransactionAnalytics should return analytics data', async () => {
        const mockAnalytics = { totalSpent: 500 };
        mockTransactionService.getTransactionAnalytics.mockResolvedValue(mockAnalytics);

        const response = await request(app).get('/transaction/analytics').query({ userId: '1' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockAnalytics });
        expect(mockTransactionService.getTransactionAnalytics).toHaveBeenCalledWith('1');
    });
});