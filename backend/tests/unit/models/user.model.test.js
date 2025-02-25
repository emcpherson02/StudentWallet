const UserModel = require('../../../src/models/user.model');

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

    describe('findByEmail', () => {
        it('should return user data when user exists', async () => {
            const mockUserData = { name: 'Test User', email: 'test@example.com' };
            mockGet.mockResolvedValue({ exists: true, id: 'test@example.com', data: () => mockUserData });

            const result = await userModel.findByEmail('test@example.com');

            expect(result).toEqual({ id: 'test@example.com', ...mockUserData });
            expect(mockDb.collection).toHaveBeenCalledWith('users');
        });

        it('should return null when user does not exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const result = await userModel.findByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return user data when user exists', async () => {
            const mockUserData = { name: 'Test User', email: 'test@example.com' };
            mockGet.mockResolvedValue({ exists: true, id: 'userId123', data: () => mockUserData });

            const result = await userModel.findById('userId123');

            expect(result).toEqual({ id: 'userId123', ...mockUserData });
        });

        it('should return null when user does not exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const result = await userModel.findById('nonexistentId');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const userData = { email: 'test@example.com', name: 'Test User' };
            mockSet.mockResolvedValue(undefined);

            const result = await userModel.create(userData);

            expect(result).toEqual({ id: 'test@example.com', ...userData });
            expect(mockSet).toHaveBeenCalledWith(userData);
        });
    });

    describe('update', () => {
        it('should update existing user', async () => {
            const updates = { name: 'Updated Name' };
            mockGet.mockResolvedValue({ exists: true });
            mockUpdate.mockResolvedValue(undefined);

            const result = await userModel.update('userId123', updates);

            expect(result).toEqual({ id: 'userId123', ...updates });
            expect(mockUpdate).toHaveBeenCalledWith(updates);
        });

        it('should return null when user does not exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const result = await userModel.update('nonexistentId', { name: 'New Name' });

            expect(result).toBeNull();
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('getLinkedAccounts', () => {
        it('should return linked accounts', async () => {
            const mockAccounts = [
                { id: 'account1', data: () => ({ Balance: 1000 }) },
                { id: 'account2', data: () => ({ Balance: 2000 }) }
            ];
            mockGet.mockResolvedValue({ docs: mockAccounts });

            const result = await userModel.getLinkedAccounts('userId123');

            expect(result).toEqual([
                { type: 'account1', balance: 1000 },
                { type: 'account2', balance: 2000 }
            ]);
        });
    });

    describe('findAllWithNotifications', () => {
        it('should return users with notifications enabled', async () => {
            const mockUsers = [
                { id: 'user1', data: () => ({ name: 'User 1', notificationsEnabled: true }) },
                { id: 'user2', data: () => ({ name: 'User 2', notificationsEnabled: true }) }
            ];
            mockGet.mockResolvedValue({ docs: mockUsers });

            const result = await userModel.findAllWithNotifications();

            expect(result).toEqual([
                { id: 'user1', name: 'User 1', notificationsEnabled: true },
                { id: 'user2', name: 'User 2', notificationsEnabled: true }
            ]);
            expect(mockWhere).toHaveBeenCalledWith('notificationsEnabled', '==', true);
        });

        it('should handle errors', async () => {
            mockGet.mockRejectedValue(new Error('Database error'));

            await expect(userModel.findAllWithNotifications()).rejects.toThrow('Database error');
        });
    });

    describe('getNotificationHistory', () => {
        it('should return notification history', async () => {
            const mockNotifications = [
                { id: 'notif1', data: () => ({ message: 'Test 1', timestamp: '2024-01-01' }) },
                { id: 'notif2', data: () => ({ message: 'Test 2', timestamp: '2024-01-02' }) }
            ];
            mockGet.mockResolvedValue({ docs: mockNotifications });

            const result = await userModel.getNotificationHistory('userId123');

            expect(result).toEqual([
                { id: 'notif1', message: 'Test 1', timestamp: '2024-01-01' },
                { id: 'notif2', message: 'Test 2', timestamp: '2024-01-02' }
            ]);
            expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
            expect(mockLimit).toHaveBeenCalledWith(10);
        });
    });

    describe('addCategory', () => {
        it('should add new category when no categories exist', async () => {
            mockGet.mockResolvedValue({ exists: false });
            mockSet.mockResolvedValue(undefined);

            const result = await userModel.addCategory('userId123', 'NewCategory');

            expect(result).toBe('NewCategory');
            expect(mockSet).toHaveBeenCalledWith({ categories: ['NewCategory'] });
        });

        it('should add category to existing categories', async () => {
            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({ categories: ['ExistingCategory'] })
            });
            mockUpdate.mockResolvedValue(undefined);

            const result = await userModel.addCategory('userId123', 'NewCategory');

            expect(result).toBe('NewCategory');
            expect(mockUpdate).toHaveBeenCalledWith({
                categories: ['ExistingCategory', 'NewCategory']
            });
        });

        it('should not add duplicate category', async () => {
            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({ categories: ['ExistingCategory'] })
            });

            const result = await userModel.addCategory('userId123', 'ExistingCategory');

            expect(result).toBe('ExistingCategory');
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });

    describe('getCategories', () => {
        it('should return categories when they exist', async () => {
            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({ categories: ['Category1', 'Category2'] })
            });

            const result = await userModel.getCategories('userId123');

            expect(result).toEqual(['Category1', 'Category2']);
        });

        it('should return empty array when no categories exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const result = await userModel.getCategories('userId123');

            expect(result).toEqual([]);
        });
    });

    describe('deleteCategory', () => {
        it('should delete category successfully', async () => {
            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({ categories: ['Category1', 'Category2'] })
            });
            mockUpdate.mockResolvedValue(undefined);

            const result = await userModel.deleteCategory('userId123', 'Category1');

            expect(result).toBe(true);
            expect(mockUpdate).toHaveBeenCalledWith({
                categories: ['Category2']
            });
        });

        it('should return false when categories document does not exist', async () => {
            mockGet.mockResolvedValue({ exists: false });

            const result = await userModel.deleteCategory('userId123', 'Category1');

            expect(result).toBe(false);
            expect(mockUpdate).not.toHaveBeenCalled();
        });
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