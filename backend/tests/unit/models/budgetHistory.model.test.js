const BudgetHistoryModel = require('../../../src/models/budgetHistory.model');

describe('BudgetHistoryModel', () => {
    let budgetHistoryModel;
    let mockDb;
    let mockGet;
    let mockSet;
    let mockUpdate;
    let mockDate;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDate = new Date('2024-02-15T12:00:00Z');
        const mockDateClass = class extends Date {
            constructor() {
                return mockDate;
            }
        };
        global.Date = mockDateClass;
        global.Date.now = jest.fn(() => mockDate.getTime());

        mockGet = jest.fn();
        mockSet = jest.fn();
        mockUpdate = jest.fn();

        const createMockCollection = () => ({
            doc: jest.fn().mockReturnValue({
                get: mockGet,
                set: mockSet,
                update: mockUpdate,
                collection: createMockCollection
            }),
            get: mockGet
        });

        mockDb = {
            collection: jest.fn().mockReturnValue(createMockCollection())
        };

        budgetHistoryModel = new BudgetHistoryModel(mockDb);
    });

    afterEach(() => {
        global.Date = Date;
    });

    describe('create', () => {
        it('should create a new budget history record for a new category', async () => {
            const userId = 'user123';
            const historyData = {
                category: 'Food',
                startDate: '2024-02-01',
                period: 'monthly',
                amount: 500,
                spent: 300
            };

            mockGet.mockResolvedValueOnce({ exists: false });
            mockSet.mockResolvedValueOnce();
            mockUpdate.mockResolvedValueOnce();

            const result = await budgetHistoryModel.create(userId, historyData);

            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(mockSet).toHaveBeenCalledWith({
                category: 'Food',
                period: 'monthly',
                records: {}
            });
            expect(mockUpdate).toHaveBeenCalledWith({
                'records.2024-02': {
                    ...historyData,
                    createdAt: mockDate
                }
            });
            expect(result).toEqual(historyData);
        });

        it('should update existing category with new record', async () => {
            const userId = 'user123';
            const historyData = {
                category: 'Food',
                startDate: '2024-02-01',
                period: 'monthly',
                amount: 500,
                spent: 300
            };

            mockGet.mockResolvedValueOnce({ exists: true });
            mockUpdate.mockResolvedValueOnce();

            const result = await budgetHistoryModel.create(userId, historyData);

            expect(mockSet).not.toHaveBeenCalled();
            expect(mockUpdate).toHaveBeenCalledWith({
                'records.2024-02': {
                    ...historyData,
                    createdAt: mockDate
                }
            });
            expect(result).toEqual(historyData);
        });
    });

    describe('findByCategory', () => {
        it('should return empty array when no records exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await budgetHistoryModel.findByCategory(
                'user123',
                'Food',
                '2024-01',
                '2024-12'
            );

            expect(result).toEqual([]);
        });

        it('should return filtered records within date range', async () => {
            const mockData = {
                exists: true,
                data: () => ({
                    records: {
                        '2024-01': { amount: 500, spent: 400 },
                        '2024-02': { amount: 500, spent: 300 },
                        '2024-03': { amount: 500, spent: 200 },
                        '2024-04': { amount: 500, spent: 100 }
                    }
                })
            };
            mockGet.mockResolvedValueOnce(mockData);

            const result = await budgetHistoryModel.findByCategory(
                'user123',
                'Food',
                '2024-02',
                '2024-03'
            );

            expect(result).toHaveLength(2);
            expect(result).toEqual([
                { amount: 500, spent: 300 },
                { amount: 500, spent: 200 }
            ]);
        });
    });

    describe('findByPeriod', () => {
        it('should return empty array when no categories exist', async () => {
            const mockDocs = [];
            mockGet.mockResolvedValueOnce({
                docs: mockDocs,
                forEach: (callback) => mockDocs.forEach(callback)
            });

            const result = await budgetHistoryModel.findByPeriod(
                'user123',
                '2024-01',
                '2024-12'
            );

            expect(result).toEqual([]);
        });

        it('should aggregate records from all categories within date range', async () => {
            const mockDocs = [
                {
                    data: () => ({
                        records: {
                            '2024-01': { category: 'Food', amount: 500, spent: 400 },
                            '2024-02': { category: 'Food', amount: 500, spent: 300 }
                        }
                    })
                },
                {
                    data: () => ({
                        records: {
                            '2024-01': { category: 'Transport', amount: 200, spent: 150 },
                            '2024-02': { category: 'Transport', amount: 200, spent: 180 }
                        }
                    })
                }
            ];
            mockGet.mockResolvedValueOnce({
                docs: mockDocs,
                forEach: (callback) => mockDocs.forEach(callback)
            });

            const result = await budgetHistoryModel.findByPeriod(
                'user123',
                '2024-01',
                '2024-02'
            );

            expect(result).toHaveLength(4);
            expect(result).toEqual([
                { category: 'Food', amount: 500, spent: 400 },
                { category: 'Food', amount: 500, spent: 300 },
                { category: 'Transport', amount: 200, spent: 150 },
                { category: 'Transport', amount: 200, spent: 180 }
            ]);
        });

        it('should filter out records outside date range', async () => {
            const mockDocs = [
                {
                    data: () => ({
                        records: {
                            '2024-01': { category: 'Food', amount: 500, spent: 400 },
                            '2024-03': { category: 'Food', amount: 500, spent: 300 }
                        }
                    })
                }
            ];
            mockGet.mockResolvedValueOnce({
                docs: mockDocs,
                forEach: (callback) => mockDocs.forEach(callback)
            });

            const result = await budgetHistoryModel.findByPeriod(
                'user123',
                '2024-01',
                '2024-02'
            );

            expect(result).toHaveLength(1);
            expect(result).toEqual([
                { category: 'Food', amount: 500, spent: 400 }
            ]);
        });
    });
});