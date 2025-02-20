const BudgetService = require('../../../src/services/budget.service');
const { DatabaseError, ValidationError, NotFoundError } = require('../../../src/utils/errors');
const { validateCategory } = require('../../../src/utils/constants');

jest.mock('../../../src/utils/constants', () => ({
    validateCategory: jest.fn()
}));

describe('BudgetService', () => {
    let budgetService;
    let mockBudgetModel;
    let mockTransactionModel;

    beforeEach(() => {
        mockBudgetModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };
        mockTransactionModel = {
            findByUserId: jest.fn()
        };
        budgetService = new BudgetService(mockBudgetModel, mockTransactionModel);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addBudget', () => {
        const userId = 'test-user-id';
        const validBudgetData = {
            category: 'Food',
            amount: 500,
            period: 'monthly',
            startDate: '2024-01-01',
            endDate: '2024-01-31'
        };

        it('should successfully add a budget', async () => {
            validateCategory.mockReturnValue(true);
            mockBudgetModel.create.mockResolvedValue({ id: 'budget-id', ...validBudgetData });

            const result = await budgetService.addBudget(userId, validBudgetData);

            expect(result).toEqual(expect.objectContaining(validBudgetData));
            expect(mockBudgetModel.create).toHaveBeenCalledWith(userId, {
                ...validBudgetData,
                spent: 0,
                startDate: validBudgetData.startDate,
                endDate: validBudgetData.endDate
            });
        });

        it('should throw ValidationError when required fields are missing', async () => {
            const invalidData = { category: 'Food' };

            await expect(budgetService.addBudget(userId, invalidData))
                .rejects
                .toThrow(ValidationError);
            expect(mockBudgetModel.create).not.toHaveBeenCalled();
        });

        it('should throw ValidationError when category is invalid', async () => {
            validateCategory.mockReturnValue(false);

            await expect(budgetService.addBudget(userId, validBudgetData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw DatabaseError when creation fails', async () => {
            validateCategory.mockReturnValue(true);
            mockBudgetModel.create.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.addBudget(userId, validBudgetData))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getBudgets', () => {
        const userId = 'test-user-id';
        const mockBudgets = [
            { id: 'budget-1', category: 'Food', amount: 500 },
            { id: 'budget-2', category: 'Transport', amount: 200 }
        ];

        it('should successfully retrieve user budgets', async () => {
            mockBudgetModel.findByUserId.mockResolvedValue(mockBudgets);

            const result = await budgetService.getBudgets(userId);

            expect(result).toEqual(mockBudgets);
            expect(mockBudgetModel.findByUserId).toHaveBeenCalledWith(userId);
        });

        it('should throw ValidationError when userId is missing', async () => {
            await expect(budgetService.getBudgets())
                .rejects
                .toThrow(ValidationError);
            expect(mockBudgetModel.findByUserId).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError when retrieval fails', async () => {
            mockBudgetModel.findByUserId.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.getBudgets(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('updateBudget', () => {
        const userId = 'test-user-id';
        const budgetId = 'budget-id';
        const updates = {
            amount: 600,
            period: 'weekly'
        };

        it('should successfully update budget', async () => {
            const updatedBudget = { id: budgetId, ...updates };
            mockBudgetModel.update.mockResolvedValue(updatedBudget);

            const result = await budgetService.updateBudget(userId, budgetId, updates);

            expect(result).toEqual(updatedBudget);
            expect(mockBudgetModel.update).toHaveBeenCalledWith(userId, budgetId, updates);
        });

        it('should throw ValidationError when required parameters are missing', async () => {
            await expect(budgetService.updateBudget(null, budgetId, updates))
                .rejects
                .toThrow(ValidationError);
            expect(mockBudgetModel.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError when budget does not exist', async () => {
            mockBudgetModel.update.mockResolvedValue(null);

            await expect(budgetService.updateBudget(userId, budgetId, updates))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when update fails', async () => {
            mockBudgetModel.update.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.updateBudget(userId, budgetId, updates))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteBudget', () => {
        const userId = 'test-user-id';
        const budgetId = 'budget-id';

        it('should successfully delete budget', async () => {
            mockBudgetModel.delete.mockResolvedValue(true);

            const result = await budgetService.deleteBudget(userId, budgetId);

            expect(result).toBe(true);
            expect(mockBudgetModel.delete).toHaveBeenCalledWith(userId, budgetId);
        });

        it('should throw ValidationError when required parameters are missing', async () => {
            await expect(budgetService.deleteBudget(null, budgetId))
                .rejects
                .toThrow(ValidationError);
            expect(mockBudgetModel.delete).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError when budget does not exist', async () => {
            mockBudgetModel.delete.mockResolvedValue(false);

            await expect(budgetService.deleteBudget(userId, budgetId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when deletion fails', async () => {
            mockBudgetModel.delete.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.deleteBudget(userId, budgetId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getBudgetSummary', () => {
        const userId = 'test-user-id';
        const mockBudgets = [
            { id: 'budget-1', category: 'Food', amount: 500 },
            { id: 'budget-2', category: 'Transport', amount: 300 }
        ];
        const mockTransactions = [
            { Amount: 100, category: 'Food' },
            { Amount: 150, category: 'Transport' }
        ];

        it('should successfully generate budget summary', async () => {
            mockBudgetModel.findByUserId.mockResolvedValue(mockBudgets);
            mockTransactionModel.findByUserId.mockResolvedValue(mockTransactions);

            const result = await budgetService.getBudgetSummary(userId);

            expect(result).toEqual({
                totalBudgets: 800,
                totalSpent: 250,
                remaining: 550,
                categoryBreakdown: expect.arrayContaining([
                    expect.objectContaining({
                        category: 'Food',
                        budgetAmount: 500,
                        spent: 100
                    }),
                    expect.objectContaining({
                        category: 'Transport',
                        budgetAmount: 300,
                        spent: 150
                    })
                ])
            });
        });

        it('should throw DatabaseError when retrieval fails', async () => {
            mockBudgetModel.findByUserId.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.getBudgetSummary(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getBudgetById', () => {
        const userId = 'test-user-id';
        const budgetId = 'budget-id';
        const mockBudget = {
            id: budgetId,
            category: 'Food',
            amount: 500
        };

        it('should successfully retrieve budget by id', async () => {
            mockBudgetModel.findById.mockResolvedValue(mockBudget);

            const result = await budgetService.getBudgetById(userId, budgetId);

            expect(result).toEqual(mockBudget);
            expect(mockBudgetModel.findById).toHaveBeenCalledWith(userId, budgetId);
        });

        it('should throw NotFoundError when budget does not exist', async () => {
            mockBudgetModel.findById.mockResolvedValue(null);

            await expect(budgetService.getBudgetById(userId, budgetId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when retrieval fails', async () => {
            mockBudgetModel.findById.mockRejectedValue(new Error('Database error'));

            await expect(budgetService.getBudgetById(userId, budgetId))
                .rejects
                .toThrow(DatabaseError);
        });
    });
});