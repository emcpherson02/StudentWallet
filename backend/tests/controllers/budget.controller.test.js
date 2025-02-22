const BudgetController = require('../../src/controllers/budget.controller');
const { ValidationError, BaseError } = require('../../src/utils/errors');

jest.mock('../../src/utils/errors', () => {
    class BaseError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
            this.isOperational = true;
        }
    }

    class ValidationError extends BaseError {
        constructor(message) {
            super(message, 400);
        }
    }

    return {
        BaseError,
        ValidationError
    };
});

describe('BudgetController', () => {
    let budgetController;
    let mockBudgetService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockBudgetService = {
            addBudget: jest.fn(),
            getBudgets: jest.fn(),
            getBudgetById: jest.fn(),
            updateBudget: jest.fn(),
            deleteBudget: jest.fn(),
            getBudgetSummary: jest.fn(),
            getTransactionsByBudgetId: jest.fn()
        };

        budgetController = new BudgetController(mockBudgetService);

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

    describe('addBudget', () => {
        it('should successfully add a budget', async () => {
            const mockBudgetData = {
                userId: '123',
                category: 'Food',
                amount: 500,
                period: 'monthly',
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };
            const mockBudgetResponse = { id: '1', ...mockBudgetData };
            
            mockReq.body = mockBudgetData;
            mockBudgetService.addBudget.mockResolvedValue(mockBudgetResponse);

            await budgetController.addBudget(mockReq, mockRes, mockNext);

            expect(mockBudgetService.addBudget).toHaveBeenCalledWith(
                mockBudgetData.userId,
                {
                    category: mockBudgetData.category,
                    amount: mockBudgetData.amount,
                    period: mockBudgetData.period,
                    startDate: mockBudgetData.startDate,
                    endDate: mockBudgetData.endDate
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Budget added successfully',
                data: mockBudgetResponse
            });
        });

        it('should handle errors when adding budget', async () => {
            const mockError = new Error('Failed to add budget');
            mockBudgetService.addBudget.mockRejectedValue(mockError);

            await budgetController.addBudget(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getBudgets', () => {
        it('should successfully get all budgets', async () => {
            const userId = '123';
            const mockBudgets = [
                { id: '1', category: 'Food', amount: 500 },
                { id: '2', category: 'Transport', amount: 300 }
            ];
            
            mockReq.query = { userId };
            mockBudgetService.getBudgets.mockResolvedValue(mockBudgets);

            await budgetController.getBudgets(mockReq, mockRes, mockNext);

            expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                budgets: mockBudgets
            });
        });

        it('should handle errors when getting budgets', async () => {
            const mockError = new Error('Failed to get budgets');
            mockBudgetService.getBudgets.mockRejectedValue(mockError);

            await budgetController.getBudgets(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getBudgetById', () => {
        it('should successfully get a budget by id', async () => {
            const mockParams = {
                userId: '123',
                budgetId: '456'
            };
            const mockBudget = { id: '456', category: 'Food', amount: 500 };
            
            mockReq.query = { userId: mockParams.userId };
            mockReq.body = { budgetId: mockParams.budgetId };
            mockBudgetService.getBudgetById.mockResolvedValue(mockBudget);

            await budgetController.getBudgetById(mockReq, mockRes, mockNext);

            expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(
                mockParams.userId,
                mockParams.budgetId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockBudget
            });
        });

        it('should handle missing parameters', async () => {
            await budgetController.getBudgetById(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Missing required parameters',
                    statusCode: 400,
                    status: 'fail',
                    isOperational: true
                })
            );
        });
    });

    describe('updateBudget', () => {
        it('should successfully update a budget', async () => {
            const mockUpdateData = {
                userId: '123',
                category: 'Food',
                amount: 600,
                period: 'monthly',
                spent: 200,
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };
            const budgetId = '456';
            const mockUpdatedBudget = { id: budgetId, ...mockUpdateData };
            
            mockReq.body = mockUpdateData;
            mockReq.params = { budgetId };
            mockBudgetService.updateBudget.mockResolvedValue(mockUpdatedBudget);

            await budgetController.updateBudget(mockReq, mockRes, mockNext);

            expect(mockBudgetService.updateBudget).toHaveBeenCalledWith(
                mockUpdateData.userId,
                budgetId,
                {
                    category: mockUpdateData.category,
                    amount: mockUpdateData.amount,
                    period: mockUpdateData.period,
                    spent: mockUpdateData.spent,
                    startDate: mockUpdateData.startDate,
                    endDate: mockUpdateData.endDate
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Budget updated successfully',
                data: mockUpdatedBudget
            });
        });
    });

    describe('deleteBudget', () => {
        it('should successfully delete a budget', async () => {
            const mockDeleteData = {
                userId: '123',
                budgetId: '456'
            };
            
            mockReq.body = { userId: mockDeleteData.userId };
            mockReq.params = { budgetId: mockDeleteData.budgetId };
            mockBudgetService.deleteBudget.mockResolvedValue(true);

            await budgetController.deleteBudget(mockReq, mockRes, mockNext);

            expect(mockBudgetService.deleteBudget).toHaveBeenCalledWith(
                mockDeleteData.userId,
                mockDeleteData.budgetId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Budget deleted successfully'
            });
        });
    });

    describe('getBudgetSummary', () => {
        it('should successfully get budget summary', async () => {
            const userId = '123';
            const mockSummary = {
                totalBudget: 1000,
                totalSpent: 500
            };
            
            mockReq.query = { userId };
            mockBudgetService.getBudgetSummary.mockResolvedValue(mockSummary);

            await budgetController.getBudgetSummary(mockReq, mockRes, mockNext);

            expect(mockBudgetService.getBudgetSummary).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockSummary
            });
        });
    });

    describe('getBudgetTransactions', () => {
        it('should successfully get budget transactions', async () => {
            const mockParams = {
                userId: '123',
                budgetId: '456'
            };
            const mockTransactions = [
                { id: '1', amount: 100, description: 'Groceries' },
                { id: '2', amount: 50, description: 'Lunch' }
            ];
            
            mockReq.query = mockParams;
            mockBudgetService.getTransactionsByBudgetId.mockResolvedValue(mockTransactions);

            await budgetController.getBudgetTransactions(mockReq, mockRes, mockNext);

            expect(mockBudgetService.getTransactionsByBudgetId).toHaveBeenCalledWith(
                mockParams.userId,
                mockParams.budgetId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockTransactions
            });
        });

        it('should handle missing parameters', async () => {
            await budgetController.getBudgetTransactions(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Missing required parameters',
                    statusCode: 400,
                    status: 'fail',
                    isOperational: true
                })
            );
        });
    });
});