const BudgetAnalyticsService = require('../../../src/services/budgetAnalytics.service');

describe('BudgetAnalyticsService', () => {
    let budgetAnalyticsService;
    let mockBudgetHistoryModel;

    const mockHistoryData = [
        {
            period: 'monthly',
            utilizationPercentage: 95,
            rolloverAmount: 50,
            actualSpent: 950,
            endDate: '2024-01-31'
        },
        {
            period: 'monthly',
            utilizationPercentage: 85,
            rolloverAmount: 150,
            actualSpent: 850,
            endDate: '2024-02-29'
        },
        {
            period: 'monthly',
            utilizationPercentage: 92,
            rolloverAmount: 80,
            actualSpent: 920,
            endDate: '2024-03-31'
        }
    ];

    beforeEach(() => {
        mockBudgetHistoryModel = {
            findByCategory: jest.fn()
        };
        budgetAnalyticsService = new BudgetAnalyticsService(mockBudgetHistoryModel);
    });

    describe('generateAnalytics', () => {
        const userId = 'test-user-id';
        const category = 'Groceries';
        const startDate = '2024-01-01';
        const endDate = '2024-03-31';

        it('should generate complete analytics report', async () => {
            mockBudgetHistoryModel.findByCategory.mockResolvedValue(mockHistoryData);

            const result = await budgetAnalyticsService.generateAnalytics(
                userId,
                category,
                startDate,
                endDate
            );

            expect(result).toHaveProperty('trends');
            expect(result).toHaveProperty('recommendations');
            expect(result).toHaveProperty('summary');
            expect(mockBudgetHistoryModel.findByCategory).toHaveBeenCalledWith(
                userId,
                category,
                startDate,
                endDate
            );
        });

        it('should handle empty history data', async () => {
            mockBudgetHistoryModel.findByCategory.mockResolvedValue([]);

            const result = await budgetAnalyticsService.generateAnalytics(
                userId,
                category,
                startDate,
                endDate
            );

            expect(result.summary).toEqual({
                totalPeriods: 0,
                totalSpent: 0,
                averageSpent: 0,
                totalRollovers: 0
            });
        });
    });

    describe('analyzeTrends', () => {
        it('should correctly analyze utilization trends', () => {
            const result = budgetAnalyticsService.analyzeTrends(mockHistoryData);

            expect(result).toHaveProperty('utilization');
            expect(result).toHaveProperty('rolloverTrends');
            expect(result).toHaveProperty('spentTrends');
            expect(result).toHaveProperty('averageUtilization');

            expect(result.utilization).toHaveLength(3);
            expect(result.averageUtilization).toBe(
                (95 + 85 + 92) / 3
            );
        });

        it('should handle empty history for trend analysis', () => {
            const result = budgetAnalyticsService.analyzeTrends([]);

            expect(result.utilization).toHaveLength(0);
            expect(result.rolloverTrends).toHaveLength(0);
            expect(result.spentTrends).toHaveLength(0);
            expect(result.averageUtilization).toBe(0);
        });
    });

    describe('generateRecommendations', () => {
        it('should recommend budget increase when utilization is high', () => {
            const trends = { averageUtilization: 95 };
            const recommendations = budgetAnalyticsService.generateRecommendations(trends);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('INCREASE_BUDGET');
        });

        it('should recommend budget decrease when utilization is low', () => {
            const trends = { averageUtilization: 65 };
            const recommendations = budgetAnalyticsService.generateRecommendations(trends);

            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].type).toBe('DECREASE_BUDGET');
        });

        it('should not make recommendations for moderate utilization', () => {
            const trends = { averageUtilization: 80 };
            const recommendations = budgetAnalyticsService.generateRecommendations(trends);

            expect(recommendations).toHaveLength(0);
        });
    });

    describe('generateSummary', () => {
        it('should generate correct summary from history data', () => {
            const summary = budgetAnalyticsService.generateSummary(mockHistoryData);

            expect(summary).toEqual({
                totalPeriods: 3,
                totalSpent: 2720, // 950 + 850 + 920
                averageSpent: 906.6666666666666, // 2720 / 3
                totalRollovers: 280 // 50 + 150 + 80
            });
        });

        it('should handle empty history for summary generation', () => {
            const summary = budgetAnalyticsService.generateSummary([]);

            expect(summary).toEqual({
                totalPeriods: 0,
                totalSpent: 0,
                averageSpent: 0,
                totalRollovers: 0
            });
        });
    });

    describe('calculateAverage', () => {
        it('should calculate correct average for array of numbers', () => {
            const numbers = [10, 20, 30, 40, 50];
            const average = budgetAnalyticsService.calculateAverage(numbers);
            expect(average).toBe(30);
        });

        it('should return 0 for empty array', () => {
            const average = budgetAnalyticsService.calculateAverage([]);
            expect(average).toBe(0);
        });

        it('should handle array with single number', () => {
            const average = budgetAnalyticsService.calculateAverage([100]);
            expect(average).toBe(100);
        });
    });
});