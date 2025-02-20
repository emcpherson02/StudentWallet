const { NotFoundError, ValidationError } = require('../../src/utils/errors');

jest.mock('../../src/config/firebase.config', () => ({
    admin: {
        firestore: {
            FieldPath: {
                documentId: jest.fn().mockReturnValue('documentId')
            }
        }
    }
}));

const LoanModel = require('../../src/models/loan.model');

describe('LoanModel', () => {
    let loanModel;
    let mockDb;
    let mockGet;
    let mockAdd;
    let mockUpdate;
    let mockDelete;
    let mockDate;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDate = new Date('2024-02-15T12:00:00Z');
        global.Date = jest.fn(() => mockDate);
        global.Date.prototype.toISOString = () => '2024-02-15T12:00:00.000Z';

        mockGet = jest.fn();
        mockAdd = jest.fn();
        mockUpdate = jest.fn();
        mockDelete = jest.fn();

        const getMockCollectionRef = () => ({
            doc: jest.fn(() => getMockDocRef()),
            add: mockAdd,
            limit: jest.fn(() => ({ get: mockGet })),
            where: jest.fn(() => ({ get: mockGet })),
            get: mockGet
        });

        const getMockDocRef = () => ({
            get: mockGet,
            update: mockUpdate,
            delete: mockDelete,
            collection: jest.fn(() => getMockCollectionRef())
        });

        mockDb = {
            collection: jest.fn(() => getMockCollectionRef())
        };

        loanModel = new LoanModel(mockDb);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('create', () => {
        it('should create a new loan for a user', async () => {
            const userId = 'user123';
            const loanData = {
                totalAmount: 1000,
                period: '2024-2025'
            };

            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({ empty: true });
            mockAdd.mockResolvedValueOnce({ id: 'loan123' });

            const result = await loanModel.create(userId, loanData);

            expect(result).toEqual({
                id: 'loan123',
                totalAmount: 1000,
                period: '2024-2025',
                trackedTransactions: [],
                remainingAmount: 1000,
                createdAt: expect.any(String)
            });
        });

        it('should throw NotFoundError if user does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            await expect(loanModel.create('nonexistent', {}))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw ValidationError if user already has a loan', async () => {
            mockGet.mockResolvedValueOnce({ exists: true });
            mockGet.mockResolvedValueOnce({ empty: false });

            await expect(loanModel.create('user123', {}))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('findByUserId', () => {
        it('should return loans with transaction details', async () => {
            const mockLoanDocs = [
                {
                    id: 'loan1',
                    data: () => ({
                        totalAmount: 1000,
                        remainingAmount: 800,
                        trackedTransactions: ['trans1', 'trans2']
                    })
                }
            ];

            const mockTransDocs = [
                {
                    id: 'trans1',
                    data: () => ({ amount: 100, description: 'Test 1' })
                },
                {
                    id: 'trans2',
                    data: () => ({ amount: 100, description: 'Test 2' })
                }
            ];

            mockGet
                .mockResolvedValueOnce({ 
                    docs: mockLoanDocs,
                    forEach: (cb) => mockLoanDocs.forEach(cb)
                })
                .mockResolvedValueOnce({
                    docs: mockTransDocs,
                    forEach: (cb) => mockTransDocs.forEach(cb)
                });

            const result = await loanModel.findByUserId('user123');

            expect(result[0]).toEqual({
                id: 'loan1',
                totalAmount: 1000,
                remainingAmount: 800,
                trackedTransactions: ['trans1', 'trans2'],
                transactions: [
                    { id: 'trans1', amount: 100, description: 'Test 1' },
                    { id: 'trans2', amount: 100, description: 'Test 2' }
                ]
            });
        });
    });

    describe('update', () => {
        it('should update loan and return updated data', async () => {
            const updates = { remainingAmount: 800 };
            
            mockGet
                .mockResolvedValueOnce({ exists: true })
                .mockResolvedValueOnce({
                    exists: true,
                    id: 'loan123',
                    data: () => ({ ...updates })
                });

            const result = await loanModel.update('user123', 'loan123', updates);

            expect(mockUpdate).toHaveBeenCalledWith(updates);
            expect(result).toEqual({
                id: 'loan123',
                ...updates
            });
        });

        it('should return null if loan does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await loanModel.update('user123', 'nonexistent', {});

            expect(result).toBeNull();
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('linkTransactionToLoan', () => {
        it('should link transaction and update remaining amount', async () => {
            mockGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    remainingAmount: 1000,
                    trackedTransactions: []
                })
            });

            const result = await loanModel.linkTransactionToLoan(
                'user123', 
                'loan123', 
                'trans123', 
                200
            );

            expect(result).toBe(true);
            expect(mockUpdate).toHaveBeenCalledWith({
                trackedTransactions: ['trans123'],
                remainingAmount: 800,
                lastUpdated: expect.any(String)
            });
        });

        it('should return false if loan does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await loanModel.linkTransactionToLoan(
                'user123', 
                'nonexistent', 
                'trans123', 
                200
            );

            expect(result).toBe(false);
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('removeTransactionFromLoan', () => {
        it('should remove transaction and update remaining amount', async () => {
            mockGet.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    remainingAmount: 800,
                    trackedTransactions: ['trans123', 'trans456']
                })
            });

            const result = await loanModel.removeTransactionFromLoan(
                'user123', 
                'loan123', 
                'trans123', 
                200
            );

            expect(result).toBe(true);
            expect(mockUpdate).toHaveBeenCalledWith({
                trackedTransactions: ['trans456'],
                remainingAmount: 1000,
                lastUpdated: expect.any(String)
            });
        });

        it('should return false if loan does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await loanModel.removeTransactionFromLoan(
                'user123', 
                'nonexistent', 
                'trans123', 
                200
            );

            expect(result).toBe(false);
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });
});