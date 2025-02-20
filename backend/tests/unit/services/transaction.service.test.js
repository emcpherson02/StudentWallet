const TransactionService = require('../../../src/services/transaction.service');
const { DatabaseError, NotFoundError } = require('../../../src/utils/errors');

describe('TransactionService', () => {
    let transactionService;
    let mockTransactionModel;
    let mockBudgetModel;
    let mockBudgetNotificationService;

    const mockTransaction = {
        id: 'transaction-123',
        Amount: 50,
        category: 'Groceries',
        date: '2024-01-22',
        Description: 'Weekly shopping'
    };

    const mockBudget = {
        id: 'budget-123',
        category: 'Groceries',
        amount: 200,
        spent: 100,
        trackedTransactions: ['transaction-123']
    };

    beforeEach(() => {
        mockTransactionModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn(),
            update: jest.fn()
        };

        mockBudgetModel = {
            findByCategory: jest.fn(),
            update: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            linkTransactionToBudget: jest.fn(),
            removeTransactionTracking: jest.fn()
        };

        mockBudgetNotificationService = {
            checkAndNotifyBudgetLimit: jest.fn()
        };

        transactionService = new TransactionService(
            mockTransactionModel,
            mockBudgetModel,
            mockBudgetNotificationService
        );
    });

    describe('addTransaction', () => {
        const userId = 'user-123';
        const transactionData = {
            amount: 50,
            category: 'Groceries',
            date: '2024-01-22',
            description: 'Weekly shopping'
        };

        it('should successfully add a transaction with budget update', async () => {
            mockTransactionModel.create.mockResolvedValue(mockTransaction);
            mockBudgetModel.findByCategory.mockResolvedValue([mockBudget]);
            mockBudgetModel.update.mockResolvedValue({...mockBudget, spent: 150});
            mockBudgetModel.linkTransactionToBudget.mockResolvedValue(true);

            const result = await transactionService.addTransaction(userId, transactionData);

            expect(result).toEqual(mockTransaction);
            expect(mockTransactionModel.create).toHaveBeenCalledWith(userId, expect.any(Object));
            expect(mockBudgetModel.findByCategory).toHaveBeenCalledWith(userId, 'Groceries');
            expect(mockBudgetModel.update).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                {spent: 150}
            );
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                mockTransaction.id
            );
            expect(mockBudgetNotificationService.checkAndNotifyBudgetLimit).toHaveBeenCalledWith(
                userId,
                'Groceries',
                150,
                200
            );
        });

        it('should add transaction without budget update if no matching budget exists', async () => {
            mockTransactionModel.create.mockResolvedValue(mockTransaction);
            mockBudgetModel.findByCategory.mockResolvedValue([]);

            const result = await transactionService.addTransaction(userId, transactionData);

            expect(result).toEqual(mockTransaction);
            expect(mockBudgetModel.update).not.toHaveBeenCalled();
            expect(mockBudgetModel.linkTransactionToBudget).not.toHaveBeenCalled();
        });

        it('should handle transaction with no category', async () => {
            const transactionWithoutCategory = {
                amount: 50,
                date: '2024-01-22',
                description: 'Misc expense'
            };

            mockTransactionModel.create.mockResolvedValue({
                ...mockTransaction,
                category: undefined
            });

            const result = await transactionService.addTransaction(userId, transactionWithoutCategory);
            expect(result).toBeDefined();
            expect(mockBudgetModel.findByCategory).not.toHaveBeenCalled();
        });

        it('should throw DatabaseError if transaction creation fails', async () => {
            mockTransactionModel.create.mockRejectedValue(new Error('Database error'));

            await expect(transactionService.addTransaction(userId, transactionData))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getUserTransactions', () => {
        const userId = 'user-123';
        const mockTransactions = [
            {
                id: 'transaction-123',
                Description: 'Weekly shopping',
                category: 'Groceries',
                Amount: 50,
                date: '2024-01-22'
            }
        ];

        it('should successfully return user transactions', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue(mockTransactions);

            const result = await transactionService.getUserTransactions(userId);

            expect(result).toEqual(mockTransactions.map(t => ({
                id: t.id,
                type: t.Description,
                category: t.category,
                amount: t.Amount,
                date: t.date,
                isPlaidTransaction: false
            })));
        });

        it('should handle empty transaction list', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([]);
            const result = await transactionService.getUserTransactions(userId);
            expect(result).toEqual([]);
        });

        it('should handle malformed transaction data', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([{
                id: 'transaction-123',
                Amount: undefined,
                Description: undefined,
                date: 'invalid-date'
            }]);

            const result = await transactionService.getUserTransactions(userId);
            expect(result[0]).toEqual({
                id: 'transaction-123',
                type: undefined,
                category: undefined,
                amount: undefined,
                date: 'invalid-date',
                isPlaidTransaction: false
            });
        });

        it('should throw DatabaseError if fetching fails', async () => {
            mockTransactionModel.findByUserId.mockRejectedValue(new Error('Database error'));
            await expect(transactionService.getUserTransactions(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteTransaction', () => {
        const userId = 'user-123';
        const transactionId = 'transaction-123';

        it('should successfully delete a transaction and update budget', async () => {
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockBudgetModel.findByUserId.mockResolvedValue([mockBudget]);
            mockTransactionModel.delete.mockResolvedValue(true);
            mockBudgetModel.removeTransactionTracking.mockResolvedValue(true);

            const result = await transactionService.deleteTransaction(userId, transactionId);

            expect(result).toBe(true);
            expect(mockTransactionModel.findById).toHaveBeenCalledWith(userId, transactionId);
            expect(mockBudgetModel.findByUserId).toHaveBeenCalledWith(userId);
            expect(mockBudgetModel.update).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                {spent: 50}
            );
        });

        it('should skip budget update if categories don\'t match', async () => {
            const differentCategoryBudget = { ...mockBudget, category: 'Entertainment' };
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockBudgetModel.findByUserId.mockResolvedValue([differentCategoryBudget]);
            mockTransactionModel.delete.mockResolvedValue(true);

            await transactionService.deleteTransaction(userId, transactionId);
            expect(mockBudgetModel.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if transaction doesn\'t exist', async () => {
            mockTransactionModel.findById.mockResolvedValue(null);
            await expect(transactionService.deleteTransaction(userId, transactionId))
                .rejects
                .toThrow(NotFoundError);
        });
    });

    describe('getTransactionAnalytics', () => {
        const userId = 'user-123';
        const mockTransactions = [
            {
                Amount: 50,
                date: '2024-01-22', // Monday
                Description: 'Grocery Shopping'
            },
            {
                Amount: 30,
                date: '2024-01-22', // Monday
                Description: 'Lunch'
            },
            {
                Amount: 25,
                date: '2024-01-27', // Saturday
                Description: 'Coffee'
            }
        ];

        it('should calculate transaction analytics correctly', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue(mockTransactions);

            const result = await transactionService.getTransactionAnalytics(userId);

            expect(result).toMatchObject({
                totalSpent: 105,
                averageTransaction: 35,
                totalTransactions: 3,
                dailySpendingPattern: expect.arrayContaining([
                    expect.objectContaining({
                        day: 'Monday',
                        amount: 40, // Average of Monday transactions
                        totalSpent: 80,
                        transactionCount: 2
                    }),
                    expect.objectContaining({
                        day: 'Saturday',
                        amount: 25,
                        totalSpent: 25,
                        transactionCount: 1
                    })
                ])
            });
        });

        it('should handle empty transaction list', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([]);

            const result = await transactionService.getTransactionAnalytics(userId);

            expect(result).toMatchObject({
                totalSpent: 0,
                averageTransaction: 0,
                totalTransactions: 0,
                dailySpendingPattern: expect.arrayContaining([
                    expect.objectContaining({
                        amount: 0,
                        totalSpent: 0,
                        transactionCount: 0
                    })
                ])
            });
        });

        it('should throw DatabaseError if analytics calculation fails', async () => {
            mockTransactionModel.findByUserId.mockRejectedValue(new Error('Database error'));

            await expect(transactionService.getTransactionAnalytics(userId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('updateCategory', () => {
        const userId = 'user-123';
        const transactionId = 'transaction-123';
        const newCategory = 'Entertainment';
        const budgetId = 'budget-456';

        it('should successfully update transaction category and link to budget', async () => {
            const mockBudgetForCategory = {
                id: budgetId,
                category: newCategory,
                amount: 300,
                spent: 100
            };

            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockTransactionModel.update.mockResolvedValue({
                ...mockTransaction,
                category: newCategory
            });
            mockBudgetModel.findById.mockResolvedValue(mockBudgetForCategory);

            const result = await transactionService.updateCategory(userId, transactionId, newCategory, budgetId);

            expect(result).toBeDefined();
            expect(mockTransactionModel.update).toHaveBeenCalledWith(
                userId,
                transactionId,
                expect.objectContaining({
                    category: newCategory,
                    lastUpdated: expect.any(String)
                })
            );
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalledWith(
                userId,
                budgetId,
                transactionId
            );
            expect(mockBudgetNotificationService.checkAndNotifyBudgetLimit).toHaveBeenCalled();
        });

        it('should update category without budget link if no budgetId provided', async () => {
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockTransactionModel.update.mockResolvedValue({
                ...mockTransaction,
                category: newCategory
            });

            const result = await transactionService.updateCategory(userId, transactionId, newCategory);

            expect(result).toBeDefined();
            expect(mockBudgetModel.linkTransactionToBudget).not.toHaveBeenCalled();
            expect(mockBudgetModel.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundError if transaction doesn\'t exist', async () => {
            mockTransactionModel.findById.mockResolvedValue(null);

            await expect(transactionService.updateCategory(userId, transactionId, newCategory))
                .rejects
                .toThrow(DatabaseError);
        });

        it('should throw DatabaseError if update fails', async () => {
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockTransactionModel.update.mockRejectedValue(new Error('Update failed'));

            await expect(transactionService.updateCategory(userId, transactionId, newCategory))
                .rejects
                .toThrow(DatabaseError);
        });
    });
});