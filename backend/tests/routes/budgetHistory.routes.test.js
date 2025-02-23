const express = require('express');
const request = require('supertest');
const setupBudgetHistoryRoutes = require('../../src/routes/budgetHistory.routes');

jest.mock('../../src/middleware/auth.middleware');

describe('Budget History Routes', () => {
    let app;
    let mockBudgetHistoryController;
    let mockAuthMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockBudgetHistoryController = {
            processRollover: jest.fn((req, res) => res.json({ success: true })),
            getAnalytics: jest.fn((req, res) => res.json({ analytics: {} }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        const router = express.Router();
        app.use('/budget-history', setupBudgetHistoryRoutes(router, mockBudgetHistoryController, mockAuthMiddleware));
    });

    describe('POST /budget-history/rollover', () => {
        it('should verify authentication', async () => {
            await request(app)
                .post('/budget-history/rollover')
                .send({ month: '2025-02' });

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should process rollover', async () => {
            await request(app)
                .post('/budget-history/rollover')
                .send({ month: '2025-02' });

            expect(mockBudgetHistoryController.processRollover).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/budget-history/rollover')
                .send({ month: '2025-02' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /budget-history/analytics', () => {
        it('should verify authentication', async () => {
            await request(app).get('/budget-history/analytics');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should get analytics data', async () => {
            await request(app).get('/budget-history/analytics');
            expect(mockBudgetHistoryController.getAnalytics).toHaveBeenCalled();
        });

        it('should return analytics data', async () => {
            const response = await request(app).get('/budget-history/analytics');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ analytics: {} });
        });
    });
});