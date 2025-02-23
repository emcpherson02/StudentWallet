const BudgetHistoryController = require('../../../src/controllers/budgetHistory.controller');

describe('BudgetHistoryController', () => {
    let budgetHistoryController;
    let mockBudgetRolloverService;
    let mockBudgetAnalyticsService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockBudgetRolloverService = {
            processRollover: jest.fn()
        };

        mockBudgetAnalyticsService = {
            generateAnalytics: jest.fn()
        };

        budgetHistoryController = new BudgetHistoryController(
            mockBudgetRolloverService,
            mockBudgetAnalyticsService
        );

        mockReq = {
            body: {},
            query: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('processRollover', () => {
        it('should successfully process budget rollover', async () => {
            const mockRolloverData = {
                userId: '123',
                budgetId: '456'
            };
            const mockRolloverResult = {
                oldBudget: { id: '456', amount: 1000 },
                newBudget: { id: '789', amount: 500 }
            };
            
            mockReq.body = mockRolloverData;
            mockBudgetRolloverService.processRollover.mockResolvedValue(mockRolloverResult);

            await budgetHistoryController.processRollover(mockReq, mockRes, mockNext);

            expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledWith(
                mockRolloverData.userId,
                mockRolloverData.budgetId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Budget rolled over successfully',
                data: mockRolloverResult
            });
        });

        it('should handle errors during rollover process', async () => {
            const mockError = new Error('Rollover failed');
            mockBudgetRolloverService.processRollover.mockRejectedValue(mockError);

            await budgetHistoryController.processRollover(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('getAnalytics', () => {
        it('should successfully get budget analytics', async () => {
            const mockAnalyticsParams = {
                userId: '123',
                category: 'Food',
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };
            const mockAnalyticsResult = {
                totalSpent: 5000,
                averageMonthlySpend: 416.67,
                trendData: [
                    { month: 'January', spent: 400 },
                    { month: 'February', spent: 450 }
                ]
            };
            
            mockReq.query = mockAnalyticsParams;
            mockBudgetAnalyticsService.generateAnalytics.mockResolvedValue(mockAnalyticsResult);

            await budgetHistoryController.getAnalytics(mockReq, mockRes, mockNext);

            expect(mockBudgetAnalyticsService.generateAnalytics).toHaveBeenCalledWith(
                mockAnalyticsParams.userId,
                mockAnalyticsParams.category,
                mockAnalyticsParams.startDate,
                mockAnalyticsParams.endDate
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockAnalyticsResult
            });
        });

        it('should handle errors when getting analytics', async () => {
            const mockError = new Error('Analytics generation failed');
            mockBudgetAnalyticsService.generateAnalytics.mockRejectedValue(mockError);

            await budgetHistoryController.getAnalytics(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should handle analytics request with partial parameters', async () => {
            const mockPartialParams = {
                userId: '123',
                category: 'Food'
            };
            const mockAnalyticsResult = {
                totalSpent: 3000,
                averageMonthlySpend: 375
            };
            
            mockReq.query = mockPartialParams;
            mockBudgetAnalyticsService.generateAnalytics.mockResolvedValue(mockAnalyticsResult);

            await budgetHistoryController.getAnalytics(mockReq, mockRes, mockNext);

            expect(mockBudgetAnalyticsService.generateAnalytics).toHaveBeenCalledWith(
                mockPartialParams.userId,
                mockPartialParams.category,
                undefined,
                undefined
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockAnalyticsResult
            });
        });
    });
});