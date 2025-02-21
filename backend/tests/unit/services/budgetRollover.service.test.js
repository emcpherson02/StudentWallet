const BudgetRolloverService = require('../../../src/services/budgetRollover.service');
const { NotFoundError, DatabaseError } = require('../../../src/utils/errors');

describe('BudgetRolloverService', () => {
    let budgetRolloverService;
    let mockBudgetModel;
    let mockBudgetHistoryModel;
    let mockNotificationService;

    const mockBudget = {
        id: 'budget-123',
        category: 'Groceries',
        period: 'monthly',
        amount: 500,
        spent: 450,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        trackedTransactions: ['transaction-1', 'transaction-2']
    };

    beforeEach(() => {
        mockBudgetModel = {
            findById: jest.fn(),
            update: jest.fn()
        };

        mockBudgetHistoryModel = {
            create: jest.fn()
        };

        mockNotificationService = {
            sendBudgetRolloverEmail: jest.fn()
        };

        budgetRolloverService = new BudgetRolloverService(
            mockBudgetModel,
            mockBudgetHistoryModel,
            mockNotificationService
        );
    });

    describe('processRollover', () => {
        const userId = 'user-123';
        const budgetId = 'budget-123';

        it('should successfully process budget rollover', async () => {
            mockBudgetModel.findById.mockResolvedValue(mockBudget);
            mockBudgetModel.update.mockResolvedValue({ ...mockBudget, spent: 0 });
            mockBudgetHistoryModel.create.mockResolvedValue({});
            mockNotificationService.sendBudgetRolloverEmail.mockResolvedValue({});

            const result = await budgetRolloverService.processRollover(userId, budgetId);

            // Verify the budget was found
            expect(mockBudgetModel.findById).toHaveBeenCalledWith(userId, budgetId);

            // Verify history record creation
            expect(mockBudgetHistoryModel.create).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({
                    budgetId: mockBudget.id,
                    category: mockBudget.category,
                    originalAmount: mockBudget.amount,
                    actualSpent: mockBudget.spent,
                    unspentAmount: mockBudget.amount - mockBudget.spent,
                    utilizationPercentage: (mockBudget.spent / mockBudget.amount) * 100,
                    status: 'WITHIN_LIMIT',
                    trackedTransactions: mockBudget.trackedTransactions
                })
            );

            // Verify notification was sent
            expect(mockNotificationService.sendBudgetRolloverEmail).toHaveBeenCalledWith(
                userId,
                mockBudget.category,
                mockBudget.amount,
                mockBudget.spent,
                mockBudget.amount - mockBudget.spent
            );

            // Verify budget update
            expect(mockBudgetModel.update).toHaveBeenCalledWith(
                userId,
                budgetId,
                expect.objectContaining({
                    spent: 0,
                    trackedTransactions: []
                })
            );
        });

        it('should throw NotFoundError when budget does not exist', async () => {
            mockBudgetModel.findById.mockResolvedValue(null);

            await expect(budgetRolloverService.processRollover(userId, budgetId))
                .rejects
                .toThrow(DatabaseError);
        });

        it('should mark budget as exceeded when utilization is over 100%', async () => {
            const overSpentBudget = { ...mockBudget, spent: 600 };
            mockBudgetModel.findById.mockResolvedValue(overSpentBudget);
            mockBudgetModel.update.mockResolvedValue({ ...overSpentBudget, spent: 0 });

            await budgetRolloverService.processRollover(userId, budgetId);

            expect(mockBudgetHistoryModel.create).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({
                    status: 'EXCEEDED'
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            mockBudgetModel.findById.mockRejectedValue(new Error('Database error'));

            await expect(budgetRolloverService.processRollover(userId, budgetId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('calculateNextPeriodDates', () => {
        it('should calculate correct dates for weekly period', () => {
            const currentEndDate = new Date('2024-01-31');
            const result = budgetRolloverService.calculateNextPeriodDates('weekly', currentEndDate);

            expect(result).toEqual({
                startDate: '2024-02-01',
                endDate: '2024-02-07'
            });
        });

        it('should calculate correct dates for monthly period', () => {
            const currentEndDate = new Date('2024-01-31');
            const result = budgetRolloverService.calculateNextPeriodDates('monthly', currentEndDate);

            expect(result).toEqual({
                startDate: '2024-02-01',
                endDate: '2024-02-29' // 2024 is a leap year
            });
        });

        it('should calculate correct dates for yearly period', () => {
            const currentEndDate = new Date('2024-01-31');
            const result = budgetRolloverService.calculateNextPeriodDates('yearly', currentEndDate);

            expect(result).toEqual({
                startDate: '2024-02-01',
                endDate: '2025-01-31'
            });
        });

        it('should handle case-insensitive period values', () => {
            const currentEndDate = new Date('2024-01-31');
            const result = budgetRolloverService.calculateNextPeriodDates('MONTHLY', currentEndDate);

            expect(result).toEqual({
                startDate: '2024-02-01',
                endDate: '2024-02-29'
            });
        });
    });
});