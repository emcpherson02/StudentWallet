const UserModel = require('../../src/models/user.model');

describe('UserModel', () => {
    let userModel;
    let mockDb;
    let mockGet;
    let mockSet;
    let mockUpdate;
    let mockDelete;
    let mockBatch;
    let mockWhere;
    let mockOrderBy;
    let mockLimit;
    let createMockDocRef;
    let createMockCollectionRef;

    beforeEach(() => {
        jest.clearAllMocks();

        mockGet = jest.fn();
        mockSet = jest.fn();
        mockUpdate = jest.fn();
        mockDelete = jest.fn();
        mockWhere = jest.fn();
        mockOrderBy = jest.fn();
        mockLimit = jest.fn();

        mockBatch = {
            delete: jest.fn(),
            commit: jest.fn().mockResolvedValue(undefined)
        };

        createMockDocRef = () => {
            const docRef = {
                get: mockGet,
                set: mockSet,
                update: mockUpdate,
                delete: mockDelete,
                collection: jest.fn()
            };
            docRef.ref = docRef; 
            docRef.collection = jest.fn(() => createMockCollectionRef());
            return docRef;
        };

        createMockCollectionRef = () => ({
            doc: jest.fn(() => createMockDocRef()),
            get: mockGet,
            where: mockWhere.mockReturnThis(),
            orderBy: mockOrderBy.mockReturnThis(),
            limit: mockLimit.mockReturnThis()
        });

        mockDb = {
            collection: jest.fn(() => createMockCollectionRef()),
            batch: jest.fn(() => mockBatch)
        };

        userModel = new UserModel(mockDb);
    });


    describe('delete', () => {
        it('should delete user and all related data', async () => {
            mockGet
                .mockResolvedValueOnce({ exists: true }) 
                .mockResolvedValueOnce({ 
                    docs: [
                        createMockDocRef(),
                        createMockDocRef()
                    ],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({
                    docs: [
                        createMockDocRef(),
                        createMockDocRef()
                    ],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({ 
                    docs: [
                        createMockDocRef(),
                        createMockDocRef()
                    ],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({ exists: true }) 
                .mockResolvedValueOnce(undefined); 

            const result = await userModel.delete('user123');

            expect(result).toBe(true);
            expect(mockBatch.commit).toHaveBeenCalledTimes(3); 
            expect(mockBatch.delete).toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalled();
        });

        it('should return false when user does not exist', async () => {
            mockGet.mockResolvedValueOnce({ exists: false });

            const result = await userModel.delete('nonexistent');

            expect(result).toBe(false);
            expect(mockBatch.commit).not.toHaveBeenCalled();
            expect(mockDelete).not.toHaveBeenCalled();
        });

        it('should handle empty subcollections', async () => {
            mockGet
                .mockResolvedValueOnce({ exists: true }) 
                .mockResolvedValueOnce({ 
                    docs: [],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({
                    docs: [],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({
                    docs: [],
                    forEach: function(cb) { this.docs.forEach(cb); }
                })
                .mockResolvedValueOnce({ exists: false })
                .mockResolvedValueOnce(undefined);

            const result = await userModel.delete('user123');

            expect(result).toBe(true);
            expect(mockBatch.commit).toHaveBeenCalledTimes(3);
            expect(mockBatch.delete).not.toHaveBeenCalled();
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });
    });

});