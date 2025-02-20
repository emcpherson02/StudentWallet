const PlaidService = require('../../../src/services/plaid.service');
const { DatabaseError } = require('../../../src/utils/errors');
const { plaidClient } = require("../../../src/config/plaid.config");

jest.mock('../../../src/config/plaid.config', () => ({
    plaidClient: {
        linkTokenCreate: jest.fn(),
        itemPublicTokenExchange: jest.fn(),
        accountsGet: jest.fn(),
        transactionsSync: jest.fn(),
        accountsBalanceGet: jest.fn()
    }
}));

describe('PlaidService', () => {
    let plaidService;
    let mockPlaidModel;
    let mockBudgetModel;
    let mockBudgetNotificationService;
    const mockUserId = 'user-123';
    const mockTokens = { accessToken: 'access-token-123', itemId: 'item-123' };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPlaidModel = {
            storeTokens: jest.fn().mockResolvedValue(true),
            getTokens: jest.fn().mockResolvedValue(mockTokens),
            getStoredTransactions: jest.fn().mockResolvedValue([]),
            createTransaction: jest.fn()
        };
        mockBudgetModel = {
            findByCategory: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue(true),
            linkTransactionToBudget: jest.fn().mockResolvedValue(true)
        };
        mockBudgetNotificationService = {
            checkAndNotifyBudgetLimit: jest.fn().mockResolvedValue(true)
        };
        plaidService = new PlaidService(mockPlaidModel, mockBudgetModel, mockBudgetNotificationService);
    });

    describe('createLinkToken', () => {
        it('should create link token successfully', async () => {
            const mockLinkToken = 'link-token-123';
            plaidClient.linkTokenCreate.mockResolvedValue({
                data: { link_token: mockLinkToken }
            });

            const result = await plaidService.createLinkToken(mockUserId);
            expect(result).toBe(mockLinkToken);
        });

        it('should throw DatabaseError when link token creation fails', async () => {
            plaidClient.linkTokenCreate.mockRejectedValue(new Error('Failed'));
            await expect(plaidService.createLinkToken(mockUserId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('exchangePublicToken', () => {
        const mockPublicToken = 'public-token-123';
        const mockAccounts = [{
            account_id: 'acc-123',
            name: 'Test Account',
            type: 'checking',
            balances: {
                available: 1000,
                current: 1000,
                limit: null,
                iso_currency_code: 'GBP'
            }
        }];

        beforeEach(() => {
            plaidClient.itemPublicTokenExchange.mockResolvedValue({
                data: { access_token: mockTokens.accessToken, item_id: mockTokens.itemId }
            });
            plaidClient.accountsGet.mockResolvedValue({ data: { accounts: mockAccounts } });
        });

        it('should exchange token successfully', async () => {
            const result = await plaidService.exchangePublicToken(mockPublicToken, mockUserId);
            expect(result.success).toBe(true);
            expect(result.accounts).toBeDefined();
            expect(mockPlaidModel.storeTokens).toHaveBeenCalledWith(mockUserId, {
                accessToken: mockTokens.accessToken,
                itemId: mockTokens.itemId
            });
        });

        it('should throw DatabaseError when token exchange fails', async () => {
            plaidClient.itemPublicTokenExchange.mockRejectedValue(new Error('Exchange failed'));
            await expect(plaidService.exchangePublicToken(mockPublicToken, mockUserId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw DatabaseError when storing tokens fails', async () => {
            mockPlaidModel.storeTokens.mockRejectedValue(new Error('Storage failed'));
            await expect(plaidService.exchangePublicToken(mockPublicToken, mockUserId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('getAccounts', () => {
        const mockAccounts = [{
            account_id: 'acc-123',
            name: 'Test Account',
            type: 'checking',
            subtype: 'checking',
            balances: {
                available: 1000,
                current: 1000,
                limit: null,
                iso_currency_code: 'GBP'
            }
        }];

        it('should get accounts successfully', async () => {
            plaidClient.accountsGet.mockResolvedValue({ data: { accounts: mockAccounts } });

            const result = await plaidService.getAccounts(mockUserId);
            expect(result[0]).toMatchObject({
                id: 'acc-123',
                name: 'Test Account',
                type: 'checking',
                balance: {
                    available: 1000,
                    current: 1000
                }
            });
        });

        it('should throw DatabaseError when no access token found', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(null);
            await expect(plaidService.getAccounts(mockUserId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw DatabaseError when account fetch fails', async () => {
            plaidClient.accountsGet.mockRejectedValue(new Error('Fetch failed'));
            await expect(plaidService.getAccounts(mockUserId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('fetchTransactions', () => {
        const mockPlaidTransactions = [{
            amount: 50,
            name: 'Grocery Store',
            personal_finance_category: { primary: 'FOOD_AND_DRINK' },
            date: '2024-01-22'
        }];

        const mockStoredTransaction = {
            id: 'trans-123',
            Amount: 50,
            Description: 'Grocery Store',
            category: 'Groceries',
            date: '2024-01-22',
            isPlaidTransaction: true
        };

        beforeEach(() => {
            plaidClient.transactionsSync.mockResolvedValue({
                data: { added: mockPlaidTransactions }
            });
            mockPlaidModel.createTransaction.mockResolvedValue([mockStoredTransaction]);
        });

        it('should use stored transactions when available', async () => {
            mockPlaidModel.getStoredTransactions.mockResolvedValue([mockStoredTransaction]);
            const result = await plaidService.fetchTransactions(mockUserId);
            expect(result).toEqual([mockStoredTransaction]);
        });

        it('should fetch and transform new transactions', async () => {
            mockPlaidModel.getStoredTransactions.mockResolvedValue([]);
            mockBudgetModel.findByCategory.mockResolvedValue([{
                id: 'budget-123',
                spent: 0,
                amount: 100
            }]);

            const result = await plaidService.fetchTransactions(mockUserId);
            expect(result[0].category).toBe('Groceries');
            expect(mockBudgetModel.update).toHaveBeenCalled();
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalled();
            expect(mockBudgetNotificationService.checkAndNotifyBudgetLimit).toHaveBeenCalled();
        });

        it('should handle all category mappings', async () => {
            const categories = {
                'FOOD_AND_DRINK': 'Groceries',
                'GENERAL_MERCHANDISE': 'Other',
                'TRANSPORTATION': 'Transportation',
                'RENT_AND_UTILITIES': 'Utilities',
                'ENTERTAINMENT': 'Entertainment',
                'PERSONAL_CARE': 'Other'
            };

            for (const [plaidCategory, mappedCategory] of Object.entries(categories)) {
                plaidClient.transactionsSync.mockResolvedValue({
                    data: { added: [{
                            ...mockPlaidTransactions[0],
                            personal_finance_category: { primary: plaidCategory }
                        }] }
                });
                mockPlaidModel.getStoredTransactions.mockResolvedValue([]);

                const result = await plaidService.fetchTransactions(mockUserId);
                expect(result[0].category).toBe(mappedCategory);
            }
        });

        it('should handle unknown categories as Other', async () => {
            plaidClient.transactionsSync.mockResolvedValue({
                data: { added: [{
                        ...mockPlaidTransactions[0],
                        personal_finance_category: { primary: 'UNKNOWN' }
                    }] }
            });
            mockPlaidModel.getStoredTransactions.mockResolvedValue([]);

            const result = await plaidService.fetchTransactions(mockUserId);
            expect(result[0].category).toBe('Other');
        });

        it('should throw DatabaseError when no access token found', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(null);
            await expect(plaidService.fetchTransactions(mockUserId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw DatabaseError when transaction fetch fails', async () => {
            plaidClient.transactionsSync.mockRejectedValue(new Error('Fetch failed'));
            await expect(plaidService.fetchTransactions(mockUserId))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('getBalances', () => {
        const mockBalanceAccounts = [{
            account_id: 'acc-123',
            name: 'Test Account',
            type: 'checking',
            balances: {
                available: 1000,
                current: 1000,
                limit: null,
                iso_currency_code: 'GBP'
            }
        }];

        it('should get balances successfully', async () => {
            plaidClient.accountsBalanceGet.mockResolvedValue({
                data: { accounts: mockBalanceAccounts }
            });

            const result = await plaidService.getBalances(mockUserId);
            expect(result[0].balance).toMatchObject({
                available: 1000,
                current: 1000,
                isoCurrencyCode: 'GBP'
            });
        });

        it('should throw DatabaseError when no access token found', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(null);
            await expect(plaidService.getBalances(mockUserId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw DatabaseError when balance fetch fails', async () => {
            plaidClient.accountsBalanceGet.mockRejectedValue(new Error('Fetch failed'));
            await expect(plaidService.getBalances(mockUserId))
                .rejects.toThrow(DatabaseError);
        });
    });
});