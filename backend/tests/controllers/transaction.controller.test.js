const TransactionController = require('../../src/controllers/transaction.controller');

describe('TransactionController', () => {
    let transactionController;
    let mockTransactionService;
    let mockTransactionModel;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockTransactionService = {
            addTransaction: jest.fn(),
            getUserTransactions: jest.fn(),
            deleteTransaction: jest.fn(),
            getTransactionAnalytics: jest.fn(),
            updateCategory: jest.fn()
        };

        mockTransactionModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            delete: jest.fn(),
            update: jest.fn()
        };

        transactionController = new TransactionController(
            mockTransactionService,
            mockTransactionModel
        );

        mockReq = {
            body: {},
            query: {},
            params: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('addTransaction', () => {
        it('should successfully add a transaction', async () => {
            const mockTransactionData = {
                userId: '123',
                amount: 100,
                category: 'Food',
                date: '2024-02-22',
                description: 'Groceries'
            };
            const mockTransactionResponse = { id: '1', ...mockTransactionData };
            
            mockReq.body = mockTransactionData;
            mockTransactionService.addTransaction.mockResolvedValue(mockTransactionResponse);

            await transactionController.addTransaction(mockReq, mockRes, mockNext);

            expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
                mockTransactionData.userId,
                {
                    amount: mockTransactionData.amount,
                    category: mockTransactionData.category,
                    date: mockTransactionData.date,
                    description: mockTransactionData.description
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transaction added successfully',
                data: mockTransactionResponse
            });
        });

        it('should handle errors when adding transaction', async () => {
            const mockError = new Error('Failed to add transaction');
            mockTransactionService.addTransaction.mockRejectedValue(mockError);

            await transactionController.addTransaction(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('getUserTransactions', () => {
        it('should successfully get user transactions', async () => {
            const userId = '123';
            const mockTransactions = [
                { id: '1', amount: 100, description: 'Groceries' },
                { id: '2', amount: 50, description: 'Gas' }
            ];
            
            mockReq.query = { userId };
            mockTransactionService.getUserTransactions.mockResolvedValue(mockTransactions);

            await transactionController.getUserTransactions(mockReq, mockRes, mockNext);

            expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(userId);
            expect(mockRes.json).toHaveBeenCalledWith({
                linkedBank: true,
                Transaction: mockTransactions
            });
        });

        it('should handle errors when getting transactions', async () => {
            const mockError = new Error('Failed to get transactions');
            mockTransactionService.getUserTransactions.mockRejectedValue(mockError);

            await transactionController.getUserTransactions(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('deleteTransaction', () => {
        it('should successfully delete a transaction', async () => {
            const mockData = {
                userId: '123',
                transactionId: '456'
            };
            
            mockReq.body = { userId: mockData.userId };
            mockReq.params = { transactionId: mockData.transactionId };
            mockTransactionService.deleteTransaction.mockResolvedValue(true);

            await transactionController.deleteTransaction(mockReq, mockRes, mockNext);

            expect(mockTransactionService.deleteTransaction).toHaveBeenCalledWith(
                mockData.userId,
                mockData.transactionId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transaction deleted successfully'
            });
        });

        it('should handle errors when deleting transaction', async () => {
            const mockError = new Error('Failed to delete transaction');
            mockTransactionService.deleteTransaction.mockRejectedValue(mockError);

            await transactionController.deleteTransaction(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getTransactionAnalytics', () => {
        it('should successfully get transaction analytics', async () => {
            const userId = '123';
            const mockAnalytics = {
                totalSpent: 1500,
                categoryBreakdown: {
                    Food: 500,
                    Transport: 300,
                    Entertainment: 700
                }
            };
            
            mockReq.query = { userId };
            mockTransactionService.getTransactionAnalytics.mockResolvedValue(mockAnalytics);

            await transactionController.getTransactionAnalytics(mockReq, mockRes, mockNext);

            expect(mockTransactionService.getTransactionAnalytics).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockAnalytics
            });
        });

        it('should handle errors when getting analytics', async () => {
            const mockError = new Error('Failed to get analytics');
            mockTransactionService.getTransactionAnalytics.mockRejectedValue(mockError);

            await transactionController.getTransactionAnalytics(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('updateCategory', () => {
        it('should successfully update transaction category', async () => {
            const mockUpdateData = {
                userId: '123',
                transactionId: '456',
                category: 'Entertainment',
                budgetId: '789'
            };
            const mockUpdatedTransaction = {
                id: mockUpdateData.transactionId,
                category: mockUpdateData.category,
                amount: 100
            };
            
            mockReq.body = mockUpdateData;
            mockTransactionService.updateCategory.mockResolvedValue(mockUpdatedTransaction);

            await transactionController.updateCategory(mockReq, mockRes, mockNext);

            expect(mockTransactionService.updateCategory).toHaveBeenCalledWith(
                mockUpdateData.userId,
                mockUpdateData.transactionId,
                mockUpdateData.category,
                mockUpdateData.budgetId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transaction category updated successfully',
                data: mockUpdatedTransaction
            });
        });

        it('should handle errors when updating category', async () => {
            const mockError = new Error('Failed to update category');
            mockTransactionService.updateCategory.mockRejectedValue(mockError);

            await transactionController.updateCategory(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});