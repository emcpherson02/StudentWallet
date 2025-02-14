const request = require('supertest');
const express = require('express');
const BudgetController = require('../controllers/BudgetController');
const ValidationError = require('../middleware/error.middleware');

// Mock BudgetService
const mockBudgetService = {
    addBudget: jest.fn(),
    getBudgets: jest.fn(),
    getBudgetById: jest.fn(),
    updateBudget: jest.fn(),
    deleteBudget: jest.fn(),
    getBudgetSummary: jest.fn(),
    getTransactionsByBudgetId: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize BudgetController with mock service
const budgetController = new BudgetController(mockBudgetService);

// Mock routes
app.post('/budget', (req, res, next) => budgetController.addBudget(req, res, next));
app.get('/budgets', (req, res, next) => budgetController.getBudgets(req, res, next));
app.get('/budget/:id', (req, res, next) => budgetController.getBudgetById(req, res, next));
app.put('/budget/:id', (req, res, next) => budgetController.updateBudget(req, res, next));
app.delete('/budget/:id', (req, res, next) => budgetController.deleteBudget(req, res, next));
app.get('/budget/summary', (req, res, next) => budgetController.getBudgetSummary(req, res, next));
app.get('/budget/transactions', (req, res, next) => budgetController.getBudgetTransactions(req, res, next));

describe('BudgetController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('addBudget should return success message and budget data', async () => {
        const mockBudget = { id: 1, category: 'Food', amount: 500 };
        mockBudgetService.addBudget.mockResolvedValue(mockBudget);

        const response = await request(app)
            .post('/budget')
            .send({ userId: 1, category: 'Food', amount: 500, period: 'monthly', startDate: '2024-01-01', endDate: '2024-01-31' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            status: 'success',
            message: 'Budget added successfully',
            data: mockBudget
        });
        expect(mockBudgetService.addBudget).toHaveBeenCalled();
    });

    test('getBudgets should return a list of budgets', async () => {
        const mockBudgets = [{ id: 1, category: 'Food', amount: 500 }];
        mockBudgetService.getBudgets.mockResolvedValue(mockBudgets);

        const response = await request(app).get('/budgets').query({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', budgets: mockBudgets });
        expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(1);
    });

    test('getBudgetById should return budget data', async () => {
        const mockBudget = { id: 1, category: 'Food', amount: 500 };
        mockBudgetService.getBudgetById.mockResolvedValue(mockBudget);

        const response = await request(app).get('/budget/1').query({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockBudget });
        expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(1, '1');
    });

    test('updateBudget should return updated budget data', async () => {
        const mockUpdatedBudget = { id: 1, category: 'Food', amount: 600 };
        mockBudgetService.updateBudget.mockResolvedValue(mockUpdatedBudget);

        const response = await request(app).put('/budget/1').send({ userId: 1, amount: 600 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Budget updated successfully', data: mockUpdatedBudget });
        expect(mockBudgetService.updateBudget).toHaveBeenCalled();
    });

    test('deleteBudget should return success message', async () => {
        mockBudgetService.deleteBudget.mockResolvedValue();

        const response = await request(app).delete('/budget/1').send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Budget deleted successfully' });
        expect(mockBudgetService.deleteBudget).toHaveBeenCalled();
    });

    test('getBudgetSummary should return summary data', async () => {
        const mockSummary = { totalBudget: 1000, totalSpent: 400 };
        mockBudgetService.getBudgetSummary.mockResolvedValue(mockSummary);

        const response = await request(app).get('/budget/summary').query({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockSummary });
        expect(mockBudgetService.getBudgetSummary).toHaveBeenCalledWith(1);
    });

    test('getBudgetTransactions should return transaction data', async () => {
        const mockTransactions = [{ id: 1, amount: 50, description: 'Groceries' }];
        mockBudgetService.getTransactionsByBudgetId.mockResolvedValue(mockTransactions);

        const response = await request(app).get('/budget/transactions').query({ userId: 1, budgetId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockTransactions });
        expect(mockBudgetService.getTransactionsByBudgetId).toHaveBeenCalledWith(1, 1);
    });
});