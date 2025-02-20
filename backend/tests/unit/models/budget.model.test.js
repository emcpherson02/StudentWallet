jest.mock('../../../src/models', () => ({
    budgetModel: {}
}));

jest.mock('../../../src/utils/errors', () => ({
    NotFoundError: class NotFoundError extends Error {
        constructor(message) {
            super(message);
            this.name = 'NotFoundError';
        }
    }
}));

const { NotFoundError } = require('../../../src/utils/errors');
const BudgetModel = require('../../../src/models/budget.model');

describe('BudgetModel', () => {
    let budgetModel;
    let mockDb;
    let mockGet;
    let mockAdd;
    let mockUpdate;
    let mockDelete;
    let mockWhere;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGet = jest.fn();
        mockAdd = jest.fn();
        mockUpdate = jest.fn();
        mockDelete = jest.fn();
        mockWhere = jest.fn();

        const createMockCollection = () => ({
            doc: jest.fn().mockReturnValue({
                get: mockGet,
                update: mockUpdate,
                delete: mockDelete,
                collection: createMockCollection
            }),
            add: mockAdd,
            where: mockWhere.mockReturnValue({
                get: mockGet
            }),
            get: mockGet
        });

        mockDb = {
            collection: jest.fn().mockReturnValue(createMockCollection())
        };

        budgetModel = new BudgetModel(mockDb);
    });

    describe('create', () => {
        it('should create a new budget for an existing user', async () => {
            const userId = 'user123';
            const budgetData = {
                category: 'Food',
                amount: 500,
                period: 'monthly'
            };
            
            mockGet.mockResolvedValueOnce({ exists: true });
            mockAdd.mockResolvedValueOnce({ id: 'budget123' });

            const result = await budgetModel.create(userId, budgetData);

            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(result).toEqual({ id: 'budget123', ...budgetData });
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            await expect(budgetModel.create('nonexistent', {}))
                .rejects
                .toThrow(NotFoundError);
        });
    });

    describe('findByUserId', () => {
        it('should return all budgets for a user', async () => {
            const mockBudgets = [
                { id: 'budget1', data: () => ({ category: 'Food', amount: 500 }) },
                { id: 'budget2', data: () => ({ category: 'Transport', amount: 300, spent: 150.567 }) }
            ];
            mockGet.mockResolvedValueOnce({ docs: mockBudgets });

            const result = await budgetModel.findByUserId('user123');

            expect(result).toEqual([
                { id: 'budget1', category: 'Food', amount: 500 },
                { id: 'budget2', category: 'Transport', amount: 300, spent: 150.57 }
            ]);
        });
    });

    describe('findById', () => {
        it('should return null when budget does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetModel.findById('user123', 'nonexistent');

            expect(result).toBeNull();
        });

        it('should return budget data with formatted spent value', async () => {
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => ({
                    category: 'Food',
                    amount: 500,
                    spent: 200.567
                })
            });

            const result = await budgetModel.findById('user123', 'budget123');

            expect(result).toEqual({
                id: 'budget123',
                category: 'Food',
                amount: 500,
                spent: 200.57
            });
        });
    });

    describe('update', () => {
        it('should update an existing budget', async () => {
            const updates = { amount: 600, spent: 300 };
            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => updates
            });

            const result = await budgetModel.update('user123', 'budget123', updates);

            expect(mockUpdate).toHaveBeenCalledWith(updates);
            expect(result).toEqual({ id: 'budget123', ...updates });
        });

        it('should return null when budget does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetModel.update('user123', 'nonexistent', {});

            expect(result).toBeNull();
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete an existing budget', async () => {
            mockGet.mockResolvedValueOnce({ exists: true });

            const result = await budgetModel.delete('user123', 'budget123');

            expect(mockDelete).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when budget does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetModel.delete('user123', 'nonexistent');

            expect(result).toBe(false);
            expect(mockDelete).not.toHaveBeenCalled();
        });
    });

    describe('linkTransactionToBudget', () => {
        it('should link a transaction to a budget', async () => {
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => ({
                    category: 'Food',
                    trackedTransactions: []
                })
            });

            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => ({
                    category: 'Food',
                    trackedTransactions: ['trans123']
                })
            });

            const result = await budgetModel.linkTransactionToBudget('user123', 'budget123', 'trans123');

            expect(result).toBe(true);
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                trackedTransactions: ['trans123'],
                lastUpdated: expect.any(String)
            }));
        });

        it('should return false when budget is not found', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetModel.linkTransactionToBudget('user123', 'nonexistent', 'trans123');

            expect(result).toBe(false);
        });
    });

    describe('removeTransactionTracking', () => {
        it('should remove a transaction from budget tracking', async () => {
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => ({
                    category: 'Food',
                    trackedTransactions: ['trans123', 'other-trans']
                })
            });

            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'budget123',
                data: () => ({
                    category: 'Food',
                    trackedTransactions: ['other-trans']
                })
            });

            const result = await budgetModel.removeTransactionTracking('user123', 'budget123', 'trans123');

            expect(result).toBe(true);
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                trackedTransactions: ['other-trans'],
                lastUpdated: expect.any(String)
            }));
        });

        it('should return false when budget is not found', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetModel.removeTransactionTracking('user123', 'nonexistent', 'trans123');

            expect(result).toBe(false);
        });
    });
});