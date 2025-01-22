const PlaidService = require('../../src/services/plaid.service');
const { DatabaseError } = require('../../src/utils/errors');
const {plaidClient} = require("../../src/config/plaid.config");

jest.mock('../../src/config/plaid.config', () => ({
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
    const mockUserId = 'user-123';

    const mockTokens = {
        accessToken: 'access-token-123',
        itemId: 'item-123'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPlaidModel = {
            storeTokens: jest.fn(),
            getTokens: jest.fn()
        };
        plaidService = new PlaidService(mockPlaidModel);
    });

    describe('createLinkToken', () => {
        const mockLinkToken = 'link-token-123';

        it('should successfully create a link token', async () => {
            const mockResponse = {
                data: { link_token: mockLinkToken }
            };
            plaidService.plaidClient.linkTokenCreate.mockResolvedValue(mockResponse);

            const result = await plaidService.createLinkToken(mockUserId);

            expect(result).toBe(mockLinkToken);
            expect(plaidService.plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                user: { client_user_id: mockUserId },
                client_name: 'StudentWallet',
                products: ['auth', 'transactions'],
                country_codes: ['GB'],
                language: 'en'
            });
        });

        it('should throw DatabaseError if link token creation fails', async () => {
            plaidService.plaidClient.linkTokenCreate.mockRejectedValue(new Error('Plaid API error'));

            await expect(plaidService.createLinkToken(mockUserId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('exchangePublicToken', () => {
        const mockPublicToken = 'public-token-123';

        it('should successfully exchange public token and store access token', async () => {
            const mockExchangeResponse = {
                data: {
                    access_token: mockTokens.accessToken,
                    item_id: mockTokens.itemId
                }
            };

            const mockAccountsResponse = {
                data: {
                    accounts: [{
                        account_id: 'account-123',
                        name: 'Checking',
                        type: 'depository',
                        balances: {
                            available: 1000,
                            current: 1000,
                            limit: null,
                            iso_currency_code: 'GBP'
                        }
                    }]
                }
            };

            plaidClient.itemPublicTokenExchange.mockResolvedValue(mockExchangeResponse);
            mockPlaidModel.storeTokens.mockResolvedValue(true);
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidClient.accountsGet.mockResolvedValue(mockAccountsResponse);

            const result = await plaidService.exchangePublicToken(mockPublicToken, mockUserId);

            expect(result.success).toBe(true);
            expect(result.accounts).toBeDefined();
        });

        it('should throw DatabaseError if storing tokens fails', async () => {
            const mockExchangeResponse = {
                data: { access_token: mockTokens.accessToken, item_id: mockTokens.itemId }
            };
            plaidClient.itemPublicTokenExchange.mockResolvedValue(mockExchangeResponse);
            mockPlaidModel.storeTokens.mockRejectedValue(new Error('Storage failed'));

            await expect(plaidService.exchangePublicToken(mockPublicToken, mockUserId))
                .rejects.toThrow(DatabaseError);
        });

        it('should throw DatabaseError if token exchange fails', async () => {
            plaidService.plaidClient.itemPublicTokenExchange.mockRejectedValue(new Error('Exchange failed'));

            await expect(plaidService.exchangePublicToken(mockPublicToken, mockUserId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getAccounts', () => {
        const mockAccounts = [{
            account_id: 'account-123',
            name: 'Checking',
            type: 'depository',
            subtype: 'checking',
            balances: {
                available: 1000,
                current: 1000,
                limit: null,
                iso_currency_code: 'GBP'
            }
        }];

        it('should successfully retrieve accounts', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidService.plaidClient.accountsGet.mockResolvedValue({
                data: { accounts: mockAccounts }
            });

            const result = await plaidService.getAccounts(mockUserId);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'account-123',
                name: 'Checking',
                type: 'depository',
                balance: {
                    available: 1000,
                    current: 1000
                }
            });
        });

        it('should throw DatabaseError if no access token found', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(null);

            await expect(plaidService.getAccounts(mockUserId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('fetchTransactions', () => {
        const mockTransactions = [{
            transaction_id: 'trans-123',
            amount: 50,
            date: '2024-01-22',
            name: 'Grocery Store',
            merchant_name: 'Tesco',
            personal_finance_category: {
                primary: 'GROCERIES',
                detailed: 'Groceries'
            },
            pending: false,
            account_id: 'account-123'
        }];

        it('should successfully fetch and transform transactions', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidService.plaidClient.transactionsSync.mockResolvedValue({
                data: {
                    added: mockTransactions,
                    modified: [],
                    removed: [],
                    has_more: false
                }
            });

            const result = await plaidService.fetchTransactions(mockUserId, '2024-01-01', '2024-01-31');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'trans-123',
                amount: 50,
                description: 'Grocery Store',
                merchant: 'Tesco',
                category: 'GROCERIES'
            });
        });

        it('should throw DatabaseError if transaction fetch fails', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidService.plaidClient.transactionsSync.mockRejectedValue(new Error('Fetch failed'));

            await expect(plaidService.fetchTransactions(mockUserId, '2024-01-01', '2024-01-31'))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('getBalances', () => {
        const mockBalances = [{
            account_id: 'account-123',
            name: 'Checking',
            type: 'depository',
            balances: {
                available: 1000,
                current: 1000,
                limit: null,
                iso_currency_code: 'GBP'
            }
        }];

        it('should successfully retrieve account balances', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidService.plaidClient.accountsBalanceGet.mockResolvedValue({
                data: { accounts: mockBalances }
            });

            const result = await plaidService.getBalances(mockUserId);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'account-123',
                name: 'Checking',
                type: 'depository',
                balance: {
                    available: 1000,
                    current: 1000
                }
            });
        });

        it('should throw DatabaseError if balance fetch fails', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(mockTokens);
            plaidService.plaidClient.accountsBalanceGet.mockRejectedValue(new Error('Fetch failed'));

            await expect(plaidService.getBalances(mockUserId))
                .rejects
                .toThrow(DatabaseError);
        });
    });
});