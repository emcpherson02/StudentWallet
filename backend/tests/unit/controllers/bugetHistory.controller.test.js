const request = require('supertest');
const express = require('express');
const BudgetHistoryController = require('../controllers/BudgetHistoryController');

// Mock Services
const mockBudgetRolloverService = {
    processRollover: jest.fn()
};
const mockBudgetAnalyticsService = {
    generateAnalytics: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize BudgetHistoryController with mock services
const budgetHistoryController = new BudgetHistoryController(mockBudgetRolloverService, mockBudgetAnalyticsService);

// Mock routes
app.post('/budget/rollover', (req, res, next) => budgetHistoryController.processRollover(req, res, next));
app.get('/budget/analytics', (req, res, next) => budgetHistoryController.getAnalytics(req, res, next));

describe('BudgetHistoryController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('processRollover should return success message and result data', async () => {
        const mockResult = { rolledOverAmount: 100 };
        mockBudgetRolloverService.processRollover.mockResolvedValue(mockResult);

        const response = await request(app)
            .post('/budget/rollover')
            .send({ userId: 1, budgetId: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: 'success',
            message: 'Budget rolled over successfully',
            data: mockResult
        });
        expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledWith(1, 2);
    });

    test('getAnalytics should return analytics data', async () => {
        const mockAnalytics = { totalSpent: 500, totalBudget: 1000 };
        mockBudgetAnalyticsService.generateAnalytics.mockResolvedValue(mockAnalytics);

        const response = await request(app)
            .get('/budget/analytics')
            .query({ userId: 1, category: 'Food', startDate: '2024-01-01', endDate: '2024-01-31' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockAnalytics });
        expect(mockBudgetAnalyticsService.generateAnalytics).toHaveBeenCalledWith(1, 'Food', '2024-01-01', '2024-01-31');
    });
});
