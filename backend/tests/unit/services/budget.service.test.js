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
    let mockBudgetNotificationService;
    let mockUserModel;

    beforeEach(() => {
        mockBudgetModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            linkTransactionToBudget: jest.fn()
        };
        mockTransactionModel = {
            findByUserId: jest.fn(),
            findById: jest.fn()  // Added this mock
        };
        mockBudgetNotificationService = {
            checkAndNotifyBudgetLimit: jest.fn()
        };
        mockUserModel = {
            findById: jest.fn()
        };
        budgetService = new BudgetService(
            mockBudgetModel,
            mockTransactionModel,
            mockBudgetNotificationService,
            mockUserModel
        );
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
            validateCategory.mockResolvedValue(true);
            mockBudgetModel.create.mockResolvedValue({ id: 'budget-id', ...validBudgetData });
            mockTransactionModel.findByUserId.mockResolvedValue([]);

            const result = await budgetService.addBudget(userId, validBudgetData);

            expect(result).toEqual(expect.objectContaining(validBudgetData));
            expect(mockBudgetModel.create).toHaveBeenCalledWith(userId, {
                ...validBudgetData,
                spent: 0,
                startDate: validBudgetData.startDate,
                endDate: validBudgetData.endDate
            });
            expect(validateCategory).toHaveBeenCalledWith(
                validBudgetData.category,
                mockUserModel,
                userId
            );
        });

        it('should throw ValidationError when required fields are missing', async () => {
            const invalidData = { category: 'Food' };

            await expect(budgetService.addBudget(userId, invalidData))
                .rejects
                .toThrow(ValidationError);
            expect(mockBudgetModel.create).not.toHaveBeenCalled();
        });

        it('should throw ValidationError when category is invalid', async () => {
            validateCategory.mockResolvedValue(false);

            await expect(budgetService.addBudget(userId, validBudgetData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should successfully add budget and link existing transactions', async () => {
            validateCategory.mockResolvedValue(true);
            const mockBudget = { id: 'budget-id', ...validBudgetData };
            mockBudgetModel.create.mockResolvedValue(mockBudget);

            const mockTransactions = [
                {
                    id: 'tx1',
                    category: 'Food',
                    Amount: 100,
                    date: '2024-01-15'
                }
            ];
            mockTransactionModel.findByUserId.mockResolvedValue(mockTransactions);
            mockBudgetModel.linkTransactionToBudget.mockResolvedValue(true);
            mockBudgetModel.update.mockResolvedValue({ ...mockBudget, spent: 100 });

            const result = await budgetService.addBudget(userId, validBudgetData);

            expect(result).toEqual(expect.objectContaining(validBudgetData));
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalledWith(
                userId,
                'budget-id',
                'tx1'
            );
            expect(mockBudgetNotificationService.checkAndNotifyBudgetLimit).toHaveBeenCalledWith(
                userId,
                validBudgetData.category,
                100,
                validBudgetData.amount
            );
        });

        it('should throw DatabaseError when creation fails', async () => {
            validateCategory.mockResolvedValue(true);
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
            {
                id: 'budget-1',
                category: 'Food',
                amount: 500,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                period: 'monthly',
                trackedTransactions: ['tx1']  // Add tracked transactions
            },
            {
                id: 'budget-2',
                category: 'Transport',
                amount: 300,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                period: 'monthly',
                trackedTransactions: ['tx2']  // Add tracked transactions
            }
        ];
        const mockTransactions = [
            {
                id: 'tx1',
                Amount: 100,
                category: 'Food',
                date: '2024-01-15'
            },
            {
                id: 'tx2',
                Amount: 150,
                category: 'Transport',
                date: '2024-01-15'
            }
        ];

        it('should successfully generate budget summary', async () => {
            // Mock findByUserId to return the budgets
            mockBudgetModel.findByUserId.mockResolvedValue(mockBudgets);

            // Mock findById to return each budget
            mockBudgetModel.findById
                .mockResolvedValueOnce(mockBudgets[0])
                .mockResolvedValueOnce(mockBudgets[1]);

            // Mock transaction retrieval
            mockTransactionModel.findById
                .mockImplementation(async (userId, transactionId) => {
                    return mockTransactions.find(t => t.id === transactionId);
                });

            const result = await budgetService.getBudgetSummary(userId);

            expect(result).toEqual({
                totalBudgets: 800,
                totalSpent: 250,
                remaining: 550,
                categoryBreakdown: expect.arrayContaining([
                    expect.objectContaining({
                        budgetId: 'budget-1',
                        category: 'Food',
                        budgetAmount: 500,
                        spent: 100,
                        remaining: 400,
                        percentageUsed: "20.00",
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                        period: 'monthly'
                    }),
                    expect.objectContaining({
                        budgetId: 'budget-2',
                        category: 'Transport',
                        budgetAmount: 300,
                        spent: 150,
                        remaining: 150,
                        percentageUsed: "50.00",
                        startDate: '2024-01-01',
                        endDate: '2024-01-31',
                        period: 'monthly'
                    })
                ])
            });

            // Verify the correct methods were called
            expect(mockBudgetModel.findByUserId).toHaveBeenCalledWith(userId);
            expect(mockBudgetModel.findById).toHaveBeenCalledWith(userId, 'budget-1');
            expect(mockBudgetModel.findById).toHaveBeenCalledWith(userId, 'budget-2');
            expect(mockTransactionModel.findById).toHaveBeenCalledWith(userId, 'tx1');
            expect(mockTransactionModel.findById).toHaveBeenCalledWith(userId, 'tx2');
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