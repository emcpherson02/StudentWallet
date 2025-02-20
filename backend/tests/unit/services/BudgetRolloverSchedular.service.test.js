const BudgetRolloverScheduler = require('../../../src/services/BudgetRolloverScheduler.service');

describe('BudgetRolloverScheduler', () => {
    let mockBudgetService;
    let mockBudgetRolloverService;
    let budgetRolloverScheduler;

    beforeEach(() => {
        mockBudgetService = {
            getBudgets: jest.fn()
        };

        mockBudgetRolloverService = {
            processRollover: jest.fn()
        };

        budgetRolloverScheduler = new BudgetRolloverScheduler(
            mockBudgetService,
            mockBudgetRolloverService
        );

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Cleanup after each test
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('checkUserBudgetsOnLogin', () => {
        const userId = 'user123';

        it('should process rollover for budgets that have ended', async () => {
            // Prepare test data with budgets past their end date
            const pastDate = new Date('2023-01-01');
            const currentDate = new Date('2023-02-02');

            // Mock current date
            jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

            const budgets = [
                {
                    id: 'budget1',
                    category: 'Groceries',
                    endDate: pastDate.toISOString()
                },
                {
                    id: 'budget2',
                    category: 'Entertainment',
                    endDate: pastDate.toISOString()
                }
            ];

            // Setup mock service to return test budgets
            mockBudgetService.getBudgets.mockResolvedValue(budgets);

            // Call the method
            await budgetRolloverScheduler.checkUserBudgetsOnLogin(userId);

            // Assertions
            expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(userId);
            expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledTimes(2);
            expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledWith(userId, 'budget1');
            expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledWith(userId, 'budget2');
        });

        it('should not process rollover for budgets that have not ended', async () => {
            // Prepare test data with budgets not yet ended
            const futureDate = new Date('2024-12-31');
            const currentDate = new Date('2023-02-02');

            // Modify global Date to return the current date
            const dateSpy = jest.spyOn(global, 'Date')
                .mockImplementation((arg) => {
                    return arg ? new Date(arg) : currentDate;
                });

            const budgets = [
                {
                    id: 'budget1',
                    category: 'Groceries',
                    endDate: futureDate.toISOString()
                }
            ];

            // Setup mock service to return test budgets
            mockBudgetService.getBudgets.mockResolvedValue(budgets);

            // Call the method
            await budgetRolloverScheduler.checkUserBudgetsOnLogin(userId);

            // Assertions
            expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(userId);
            expect(mockBudgetRolloverService.processRollover).not.toHaveBeenCalled();

            // Restore Date mock
            dateSpy.mockRestore();
        });

        it('should handle errors when fetching budgets', async () => {
            // Mock an error when fetching budgets
            const testError = new Error('Database connection failed');
            mockBudgetService.getBudgets.mockRejectedValue(testError);

            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error');

            // Call the method and expect it not to throw
            await budgetRolloverScheduler.checkUserBudgetsOnLogin(userId);

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[BudgetRollover] Error during budget check:',
                testError
            );
        });

        it('should handle errors during rollover processing', async () => {
            // Prepare test data with a budget past its end date
            const pastDate = new Date('2023-01-01');
            const currentDate = new Date('2023-02-02');

            // Mock current date
            jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

            const budgets = [
                {
                    id: 'budget1',
                    category: 'Groceries',
                    endDate: pastDate.toISOString()
                }
            ];

            // Setup mock service to return test budgets
            mockBudgetService.getBudgets.mockResolvedValue(budgets);

            // Mock processRollover to throw an error
            const rolloverError = new Error('Rollover processing failed');
            mockBudgetRolloverService.processRollover.mockRejectedValue(rolloverError);

            // Spy on console.error
            const consoleErrorSpy = jest.spyOn(console, 'error');

            // Call the method and expect it not to throw
            await budgetRolloverScheduler.checkUserBudgetsOnLogin(userId);

            // Verify log and error handling
            expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(userId);
            expect(mockBudgetRolloverService.processRollover).toHaveBeenCalledWith(userId, 'budget1');
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[BudgetRollover] Error during budget check:',
                rolloverError
            );
        });
    });
});