const { DatabaseError } = require('../utils/errors');
const { plaidClient } = require('../config/plaid.config');

class PlaidService {
    constructor(plaidModel) {
        this.plaidModel = plaidModel;
        this.plaidClient = plaidClient;
    }

    async createLinkToken(userId) {
        try {
            const linkTokenResponse = await this.plaidClient.linkTokenCreate({
                user: { client_user_id: userId },
                client_name: 'StudentWallet',
                products: ['auth', 'transactions'],
                country_codes: ['GB'],
                language: 'en',
            });
            return linkTokenResponse.data.link_token;
        } catch (error) {
            console.error('Error creating link token:', error.response?.data || error.message);
            throw new DatabaseError('Could not create link token.');
        }
    }

    async exchangePublicToken(publicToken, userId) {
        try {
            const tokenResponse = await this.plaidClient.itemPublicTokenExchange({
                public_token: publicToken
            });

            const { access_token: accessToken, item_id: itemId } = tokenResponse.data;

            // Store tokens
            await this.plaidModel.storeTokens(userId, { accessToken, itemId });

            // Immediately fetch accounts after linking
            const accounts = await this.getAccounts(userId);

            return {
                success: true,
                accounts
            };
        } catch (error) {
            console.error('Error exchanging public token:', error.response?.data || error.message);
            throw new DatabaseError('Could not exchange public token.');
        }
    }

    async getAccounts(userId) {
        try {
            const tokens = await this.plaidModel.getTokens(userId);
            if (!tokens) {
                throw new DatabaseError('No access token found for user');
            }

            const accountsResponse = await this.plaidClient.accountsGet({
                access_token: tokens.accessToken
            });

            return accountsResponse.data.accounts.map(account => ({
                id: account.account_id,
                name: account.name,
                type: account.type,
                subtype: account.subtype,
                balance: {
                    available: account.balances.available,
                    current: account.balances.current,
                    limit: account.balances.limit,
                    isoCurrencyCode: account.balances.iso_currency_code
                }
            }));
        } catch (error) {
            console.error('Error fetching accounts:', error.response?.data || error.message);
            throw new DatabaseError('Could not fetch accounts.');
        }
    }

    async fetchTransactions(userId, startDate, endDate) {
        try {
            const tokens = await this.plaidModel.getTokens(userId);
            if (!tokens) {
                throw new DatabaseError('No access token found for user');
            }

            console.log('Start Date:', startDate);
            console.log('End Date:', endDate);
            console.log('Access Token:', tokens.accessToken ? 'exists' : 'missing');

            let allTransactions = [];
            let hasMore = true;
            let cursor = null;

            // Initial request without cursor
            const initialRequest = {
                access_token: tokens.accessToken,
            };

            // Use transactionsSync instead of get
            const response = await this.plaidClient.transactionsSync(initialRequest);
            const data = response.data;

            // Transform transactions
            return data.added.map(transaction => ({
                id: transaction.transaction_id,
                amount: transaction.amount,
                date: transaction.date,
                description: transaction.name,
                merchant: transaction.merchant_name,
                category: transaction.personal_finance_category?.primary,
                subCategory: transaction.personal_finance_category?.detailed,
                pending: transaction.pending,
                accountId: transaction.account_id
            }));
        } catch (error) {
            console.error('Detailed Plaid Error:', error.response?.data || error);
            throw new DatabaseError('Could not fetch transactions.');
        }
    }

    async getBalances(userId) {
        try {
            const tokens = await this.plaidModel.getTokens(userId);
            if (!tokens) {
                throw new DatabaseError('No access token found for user');
            }

            const response = await this.plaidClient.accountsBalanceGet({
                access_token: tokens.accessToken
            });

            return response.data.accounts.map(account => ({
                id: account.account_id,
                name: account.name,
                type: account.type,
                balance: {
                    available: account.balances.available,
                    current: account.balances.current,
                    limit: account.balances.limit,
                    isoCurrencyCode: account.balances.iso_currency_code
                }
            }));
        } catch (error) {
            console.error('Error fetching balances:', error.response?.data || error.message);
            throw new DatabaseError('Could not fetch balances.');
        }
    }
}

module.exports = PlaidService;
