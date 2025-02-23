const express = require('express');
const request = require('supertest');
const setupBudgetRoutes = require('../../src/routes/budget.routes');

jest.mock('../../src/middleware/auth.middleware');

describe('Budget Routes', () => {
    let app;
    let mockBudgetController;
    let mockAuthMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockBudgetController = {
            addBudget: jest.fn((req, res) => res.json({ success: true })),
            getBudgets: jest.fn((req, res) => res.json({ budgets: [] })),
            updateBudget: jest.fn((req, res) => res.json({ success: true })),
            deleteBudget: jest.fn((req, res) => res.json({ success: true })),
            getBudgetSummary: jest.fn((req, res) => res.json({ summary: {} })),
            getBudgetById: jest.fn((req, res) => res.json({ budget: {} })),
            getBudgetTransactions: jest.fn((req, res) => res.json({ transactions: [] }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        const router = express.Router();
        app.use('/budget', setupBudgetRoutes(router, mockBudgetController, mockAuthMiddleware));
    });

    describe('POST /budget/add_budget', () => {
        it('should call verifyToken middleware', async () => {
            await request(app)
                .post('/budget/add_budget')
                .send({ category: 'Food', amount: 200, period: 'monthly' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should call addBudget controller method', async () => {
            await request(app)
                .post('/budget/add_budget')
                .send({ category: 'Food', amount: 200, period: 'monthly' });

            expect(mockBudgetController.addBudget).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/budget/add_budget')
                .send({ category: 'Food', amount: 200, period: 'monthly' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /budget/get_budgets', () => {
        it('should validate authentication', async () => {
            await request(app).get('/budget/get_budgets');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch budgets', async () => {
            await request(app).get('/budget/get_budgets');
            expect(mockBudgetController.getBudgets).toHaveBeenCalled();
        });

        it('should return budgets', async () => {
            const response = await request(app).get('/budget/get_budgets');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ budgets: [] });
        });
    });

    describe('PUT /budget/update_budget/:budgetId', () => {
        it('should verify authentication', async () => {
            await request(app)
                .put('/budget/update_budget/123')
                .send({ amount: 300 });
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should update budget', async () => {
            await request(app)
                .put('/budget/update_budget/123')
                .send({ amount: 300 });
            expect(mockBudgetController.updateBudget).toHaveBeenCalled();
        });

        it('should confirm update', async () => {
            const response = await request(app)
                .put('/budget/update_budget/123')
                .send({ amount: 300 });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('DELETE /budget/delete_budget/:budgetId', () => {
        it('should check authentication', async () => {
            await request(app).delete('/budget/delete_budget/123');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should remove budget', async () => {
            await request(app).delete('/budget/delete_budget/123');
            expect(mockBudgetController.deleteBudget).toHaveBeenCalled();
        });

        it('should confirm deletion', async () => {
            const response = await request(app).delete('/budget/delete_budget/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /budget/analytics/summary', () => {
        it('should authenticate request', async () => {
            await request(app).get('/budget/analytics/summary');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should get summary', async () => {
            await request(app).get('/budget/analytics/summary');
            expect(mockBudgetController.getBudgetSummary).toHaveBeenCalled();
        });

        it('should return summary data', async () => {
            const response = await request(app).get('/budget/analytics/summary');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ summary: {} });
        });
    });

    describe('GET /budget/budgetById', () => {
        it('should validate auth', async () => {
            await request(app).get('/budget/budgetById');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch budget', async () => {
            await request(app).get('/budget/budgetById');
            expect(mockBudgetController.getBudgetById).toHaveBeenCalled();
        });

        it('should return budget data', async () => {
            const response = await request(app).get('/budget/budgetById');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ budget: {} });
        });
    });

    describe('GET /budget/transactions', () => {
        it('should verify auth', async () => {
            await request(app).get('/budget/transactions');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should get transactions', async () => {
            await request(app).get('/budget/transactions');
            expect(mockBudgetController.getBudgetTransactions).toHaveBeenCalled();
        });

        it('should return transaction data', async () => {
            const response = await request(app).get('/budget/transactions');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ transactions: [] });
        });
    });
});