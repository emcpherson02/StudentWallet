jest.mock('../../../src/utils/errors', () => ({
    NotFoundError: class NotFoundError extends Error {
        constructor(message) {
            super(message);
            this.name = 'NotFoundError';
        }
    }
}));

const { NotFoundError } = require('../../../src/utils/errors');
const TransactionModel = require('../../../src/models/transaction.model');

describe('TransactionModel', () => {
    let transactionModel;
    let mockDb;
    let mockGet;
    let mockAdd;
    let mockUpdate;
    let mockDelete;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGet = jest.fn();
        mockAdd = jest.fn();
        mockUpdate = jest.fn();
        mockDelete = jest.fn();

        const createMockDocRef = () => ({
            get: mockGet,
            update: mockUpdate,
            delete: mockDelete,
            collection: jest.fn(() => createMockCollectionRef())
        });

        const createMockCollectionRef = () => ({
            doc: jest.fn(() => createMockDocRef()),
            add: mockAdd,
            get: mockGet
        });

        mockDb = {
            collection: jest.fn(() => createMockCollectionRef())
        };

        transactionModel = new TransactionModel(mockDb);
    });

    describe('create', () => {
        it('should create a new transaction for existing user', async () => {
            const userId = 'user123';
            const transactionData = {
                amount: 100,
                description: 'Test transaction'
            };

            mockGet.mockResolvedValueOnce({ exists: true });
            mockAdd.mockResolvedValueOnce({ id: 'trans123' });

            const result = await transactionModel.create(userId, transactionData);

            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(mockAdd).toHaveBeenCalledWith(transactionData);
            expect(result).toEqual({
                id: 'trans123',
                amount: 100,
                description: 'Test transaction'
            });
        });

        it('should throw NotFoundError if user does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            await expect(transactionModel.create('nonexistent', {}))
                .rejects
                .toThrow(NotFoundError);
            
            expect(mockAdd).not.toHaveBeenCalled();
        });
    });

    describe('findByUserId', () => {
        it('should return all transactions for a user', async () => {
            const mockTransactions = [
                {
                    id: 'trans1',
                    data: () => ({
                        amount: 100,
                        description: 'Test 1'
                    })
                },
                {
                    id: 'trans2',
                    data: () => ({
                        amount: 200,
                        description: 'Test 2'
                    })
                }
            ];

            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                docs: mockTransactions
            });

            const result = await transactionModel.findByUserId('user123');

            expect(result).toEqual([
                { id: 'trans1', amount: 100, description: 'Test 1' },
                { id: 'trans2', amount: 200, description: 'Test 2' }
            ]);
        });

        it('should throw NotFoundError if user does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            await expect(transactionModel.findByUserId('nonexistent'))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should return empty array when user has no transactions', async () => {
            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                docs: []
            });

            const result = await transactionModel.findByUserId('user123');

            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('should return transaction by id', async () => {
            const mockTransaction = {
                exists: true,
                id: 'trans123',
                data: () => ({
                    amount: 100,
                    description: 'Test transaction'
                })
            };

            mockGet.mockResolvedValueOnce(mockTransaction);

            const result = await transactionModel.findById('user123', 'trans123');

            expect(result).toEqual({
                id: 'trans123',
                amount: 100,
                description: 'Test transaction'
            });
        });

        it('should return null if transaction does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await transactionModel.findById('user123', 'nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('delete', () => {
        it('should delete existing transaction', async () => {
            mockGet.mockResolvedValueOnce({ exists: true });
            mockDelete.mockResolvedValueOnce();

            const result = await transactionModel.delete('user123', 'trans123');

            expect(mockDelete).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false if transaction does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await transactionModel.delete('user123', 'nonexistent');

            expect(result).toBe(false);
            expect(mockDelete).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update transaction and return updated data', async () => {
            const updates = {
                amount: 150,
                description: 'Updated test'
            };

            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({
                exists: true,
                id: 'trans123',
                data: () => updates
            });

            const result = await transactionModel.update('user123', 'trans123', updates);

            expect(mockUpdate).toHaveBeenCalledWith(updates);
            expect(result).toEqual({
                id: 'trans123',
                amount: 150,
                description: 'Updated test'
            });
        });

        it('should return null if transaction does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await transactionModel.update('user123', 'nonexistent', {});

            expect(result).toBeNull();
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });
});