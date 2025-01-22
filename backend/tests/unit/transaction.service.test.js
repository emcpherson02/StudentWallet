const TransactionService = require('../../src/services/transaction.service');
const { DatabaseError, NotFoundError } = require('../../src/utils/errors');

describe('TransactionService', () => {
    let transactionService;
    let mockTransactionModel;
    let mockBudgetModel;

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
        spent: 100,
        trackedTransactions: ['transaction-123']
    };

    beforeEach(() => {
        mockTransactionModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            delete: jest.fn()
        };

        mockBudgetModel = {
            findByCategory: jest.fn(),
            update: jest.fn(),
            findByUserId: jest.fn(),
            linkTransactionToBudget: jest.fn(),
            removeTransactionTracking: jest.fn()
        };

        transactionService = new TransactionService(mockTransactionModel, mockBudgetModel);
    });

    describe('addTransaction', () => {
        it('should handle empty transaction list gracefully', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([]);
            const result = await transactionService.getUserTransactions(userId);
            expect(result).toEqual([]);
        });

        it('should handle malformed transaction data', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([{
                id: 'transaction-123',
                Amount: null,
                Description: undefined,
                date: 'invalid-date'
            }]);

            const result = await transactionService.getUserTransactions(userId);
            expect(result[0]).toEqual({
                id: 'transaction-123',
                type: undefined,
                category: undefined,
                amount: null,
                date: 'invalid-date'
            });
        });


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
            mockBudgetModel.update.mockResolvedValue({ ...mockBudget, spent: 150 });
            mockBudgetModel.linkTransactionToBudget.mockResolvedValue(true);

            const result = await transactionService.addTransaction(userId, transactionData);

            expect(result).toEqual(mockTransaction);
            expect(mockTransactionModel.create).toHaveBeenCalledWith(userId, expect.any(Object));
            expect(mockBudgetModel.findByCategory).toHaveBeenCalledWith(userId, 'Groceries');
            expect(mockBudgetModel.update).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                { spent: 150 }
            );
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                mockTransaction.id
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
                date: t.date
            })));
            expect(mockTransactionModel.findByUserId).toHaveBeenCalledWith(userId);
        });

        it('should throw DatabaseError if fetching transactions fails', async () => {
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
                { spent: 50 }
            );
            expect(mockBudgetModel.removeTransactionTracking).toHaveBeenCalledWith(
                userId,
                mockBudget.id,
                transactionId
            );
            expect(mockTransactionModel.delete).toHaveBeenCalledWith(userId, transactionId);
        });

        it('should throw NotFoundError if transaction does not exist', async () => {
            mockTransactionModel.findById.mockResolvedValue(null);

            await expect(transactionService.deleteTransaction(userId, transactionId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError if deletion fails', async () => {
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockBudgetModel.findByUserId.mockResolvedValue([mockBudget]);
            mockTransactionModel.delete.mockResolvedValue(false);

            await expect(transactionService.deleteTransaction(userId, transactionId))
                .rejects
                .toThrow(NotFoundError);
        });
    });
});