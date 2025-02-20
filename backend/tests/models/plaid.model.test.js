const PlaidModel = require('../../src/models/plaid.model');

describe('PlaidModel', () => {
    let plaidModel;
    let mockDb;
    let mockGet;
    let mockSet;
    let mockAdd;
    let mockUpdate;
    let mockDelete;
    let mockBatch;
    let mockBatchSet;
    let mockBatchDelete;
    let mockBatchCommit;
    let mockWhere;
    let mockDate;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDate = new Date('2024-02-15T12:00:00Z');
        global.Date = jest.fn(() => mockDate);

        mockGet = jest.fn();
        mockSet = jest.fn();
        mockAdd = jest.fn();
        mockUpdate = jest.fn();
        mockDelete = jest.fn();
        mockWhere = jest.fn();
        mockBatchSet = jest.fn();
        mockBatchDelete = jest.fn();
        mockBatchCommit = jest.fn();

        mockBatch = {
            set: mockBatchSet,
            delete: mockBatchDelete,
            commit: mockBatchCommit
        };

        const createMockDocRef = () => {
            const ref = {
                get: mockGet,
                set: mockSet,
                update: mockUpdate,
                delete: mockDelete,
                collection: jest.fn(() => createMockCollectionRef()),
                ref: {} 
            };
            ref.ref = ref;
            return ref;
        };

        const createMockCollectionRef = () => ({
            doc: jest.fn(() => createMockDocRef()),
            add: mockAdd,
            where: mockWhere.mockReturnValue({
                get: mockGet
            }),
            get: mockGet
        });

        mockDb = {
            collection: jest.fn(() => createMockCollectionRef()),
            batch: jest.fn(() => mockBatch)
        };

        plaidModel = new PlaidModel(mockDb);
    });

    describe('storeTokens', () => {
        it('should store tokens and update linkedBank status', async () => {
            const userId = 'user123';
            const tokens = {
                accessToken: 'access123',
                itemId: 'item123'
            };

            await plaidModel.storeTokens(userId, tokens);

            expect(mockSet).toHaveBeenCalledWith({
                accessToken: 'access123',
                itemId: 'item123',
                createdAt: mockDate
            });
            expect(mockUpdate).toHaveBeenCalledWith({
                linkedBank: true
            });
        });

        it('should throw error when required parameters are missing', async () => {
            await expect(plaidModel.storeTokens('user123', {}))
                .rejects
                .toThrow('Missing required parameters');

            await expect(plaidModel.storeTokens(null, { accessToken: 'test', itemId: 'test' }))
                .rejects
                .toThrow('Missing required parameters');
        });
    });

    describe('getTokens', () => {
        it('should return tokens when they exist', async () => {
            const mockTokens = {
                accessToken: 'access123',
                itemId: 'item123',
                createdAt: mockDate
            };

            mockGet.mockResolvedValueOnce({
                exists: true,
                data: () => mockTokens
            });

            const result = await plaidModel.getTokens('user123');

            expect(result).toEqual(mockTokens);
        });

        it('should return null when tokens do not exist', async () => {
            mockGet.mockResolvedValueOnce({
                exists: false
            });

            const result = await plaidModel.getTokens('user123');

            expect(result).toBeNull();
        });

        it('should throw error when userId is not provided', async () => {
            await expect(plaidModel.getTokens())
                .rejects
                .toThrow('UserId is required');
        });
    });

    describe('createTransaction', () => {
        it('should create a single transaction', async () => {
            const transaction = {
                amount: 100,
                description: 'Test'
            };

            mockAdd.mockResolvedValueOnce({ id: 'trans123' });

            const result = await plaidModel.createTransaction('user123', transaction);

            expect(result).toEqual({
                id: 'trans123',
                amount: 100,
                description: 'Test'
            });
        });

        it('should handle batch transaction creation', async () => {
            const transactions = [
                { amount: 100, description: 'Test 1' },
                { amount: 200, description: 'Test 2' }
            ];

            mockGet.mockResolvedValueOnce({
                docs: [
                    { ref: { delete: mockDelete } }
                ]
            });

            mockDb.collection().doc().collection().doc.mockImplementation(() => ({
                ref: { id: jest.fn(() => 'trans123') }
            }));

            const result = await plaidModel.createTransaction('user123', transactions);

            expect(mockBatchCommit).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(mockBatchDelete).toHaveBeenCalled();
            expect(mockBatchSet).toHaveBeenCalledTimes(2);
        });
    });

    describe('getStoredTransactions', () => {
        it('should return stored Plaid transactions', async () => {
            const mockTransactions = [
                {
                    id: 'trans1',
                    data: () => ({
                        amount: 100,
                        description: 'Test 1',
                        isPlaidTransaction: true
                    })
                },
                {
                    id: 'trans2',
                    data: () => ({
                        amount: 200,
                        description: 'Test 2',
                        isPlaidTransaction: true
                    })
                }
            ];

            mockGet.mockResolvedValueOnce({
                docs: mockTransactions
            });

            const result = await plaidModel.getStoredTransactions('user123');

            expect(result).toEqual([
                {
                    id: 'trans1',
                    amount: 100,
                    description: 'Test 1',
                    isPlaidTransaction: true
                },
                {
                    id: 'trans2',
                    amount: 200,
                    description: 'Test 2',
                    isPlaidTransaction: true
                }
            ]);

            expect(mockWhere).toHaveBeenCalledWith('isPlaidTransaction', '==', true);
        });

        it('should return empty array when no Plaid transactions exist', async () => {
            mockGet.mockResolvedValueOnce({
                docs: []
            });

            const result = await plaidModel.getStoredTransactions('user123');

            expect(result).toEqual([]);
        });
    });
});