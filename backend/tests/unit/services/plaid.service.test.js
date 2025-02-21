const PlaidService = require('../../../src/services/plaid.service');
const { DatabaseError } = require('../../../src/utils/errors');
const { plaidClient } = require("../../../src/config/plaid.config");

jest.mock('../../../src/config/plaid.config', () => ({
    plaidClient: {
        linkTokenCreate: jest.fn(),
        itemPublicTokenExchange: jest.fn(),
        accountsGet: jest.fn(),
        transactionsSync: jest.fn(),
        accountsBalanceGet: jest.fn(),
        institutionsGetById: jest.fn()
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
            findByUserId: jest.fn().mockResolvedValue([]),
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
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                user: { client_user_id: mockUserId },
                client_name: 'StudentWallet',
                products: ['auth', 'transactions'],
                country_codes: ['GB'],
                language: 'en',
            });
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
            official_name: 'Test Official Name',
            subtype: 'checking'
        }];
        const mockInstitution = {
            institution_id: 'inst-123',
            name: 'Test Bank'
        };

        beforeEach(() => {
            plaidClient.itemPublicTokenExchange.mockResolvedValue({
                data: { access_token: mockTokens.accessToken, item_id: mockTokens.itemId }
            });
            plaidClient.accountsGet.mockResolvedValue({
                data: {
                    accounts: mockAccounts,
                    item: { institution_id: 'inst-123' }
                }
            });
            plaidClient.institutionsGetById.mockResolvedValue({
                data: { institution: mockInstitution }
            });
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
    });

    describe('getAccounts', () => {
        const mockAccounts = [{
            account_id: 'acc-123',
            name: 'Test Account',
            official_name: 'Test Official Name',
            type: 'checking',
            subtype: 'checking'
        }];

        const mockInstitution = {
            name: 'Test Bank'
        };

        beforeEach(() => {
            plaidClient.accountsGet.mockResolvedValue({
                data: {
                    accounts: mockAccounts,
                    item: { institution_id: 'inst-123' }
                }
            });
            plaidClient.institutionsGetById.mockResolvedValue({
                data: { institution: mockInstitution }
            });
        });

        it('should get accounts successfully', async () => {
            const result = await plaidService.getAccounts(mockUserId);
            expect(result[0]).toMatchObject({
                id: 'acc-123',
                name: 'Test Account',
                officialName: 'Test Official Name',
                type: 'checking',
                subtype: 'checking',
                institutionName: 'Test Bank'
            });
        });

        it('should throw DatabaseError when no access token found', async () => {
            mockPlaidModel.getTokens.mockResolvedValue(null);
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
            mockPlaidModel.createTransaction.mockResolvedValue(mockStoredTransaction);
        });

        it('should fetch and transform new transactions with budget updates', async () => {
            const mockBudget = {
                id: 'budget-123',
                spent: 0,
                amount: 100,
                category: 'Groceries',
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            };
            mockBudgetModel.findByUserId.mockResolvedValue([mockBudget]);

            const result = await plaidService.fetchTransactions(mockUserId);
            expect(result[0]).toMatchObject({
                Amount: 50,
                Description: 'Grocery Store',
                category: 'Groceries',
                date: '2024-01-22',
                isPlaidTransaction: true
            });

            expect(mockBudgetModel.update).toHaveBeenCalledWith(
                mockUserId,
                mockBudget.id,
                { spent: 50 }
            );
            expect(mockBudgetModel.linkTransactionToBudget).toHaveBeenCalledWith(
                mockUserId,
                mockBudget.id,
                mockStoredTransaction.id
            );
            expect(mockBudgetNotificationService.checkAndNotifyBudgetLimit).toHaveBeenCalledWith(
                mockUserId,
                'Groceries',
                50,
                100
            );
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
            expect(result[0]).toMatchObject({
                id: 'acc-123',
                name: 'Test Account',
                type: 'checking',
                balance: {
                    available: 1000,
                    current: 1000,
                    limit: null,
                    isoCurrencyCode: 'GBP'
                }
            });
        });
    });
});