const { DatabaseError } = require('../utils/errors');
const { plaidClient } = require('../config/plaid.config');

class PlaidService {
    constructor(plaidModel, budgetModel) {
        this.plaidModel = plaidModel;
        this.plaidClient = plaidClient;
        this.budgetModel = budgetModel;
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

            const storedTransactions = await this.plaidModel.getStoredTransactions(userId);
            if (storedTransactions && storedTransactions.length > 0) {
                return storedTransactions;
            }

            const response = await this.plaidClient.transactionsSync({
                access_token: tokens.accessToken
            });

            const categoryMapping = {
                'FOOD_AND_DRINK': 'Groceries',
                'GENERAL_MERCHANDISE': 'Other',
                'TRANSPORTATION': 'Transportation',
                'RENT_AND_UTILITIES': 'Utilities',
                'ENTERTAINMENT': 'Entertainment',
                'PERSONAL_CARE': 'Other',
                'OTHER': 'Other'
            };

            const transformedTransactions = response.data.added
                .slice(0, 10)
                .map(transaction => ({
                    Amount: transaction.amount,
                    Description: transaction.name,
                    category: categoryMapping[transaction.personal_finance_category?.primary] || 'Other',
                    date: transaction.date,
                    isPlaidTransaction: true
                }));

            for (const transaction of transformedTransactions) {
                const createdTransaction = await this.plaidModel.createTransaction(userId, transaction);

                const budgets = await this.budgetModel.findByCategory(userId, transaction.category);
                if (budgets.length > 0) {
                    const budget = budgets[0];
                    const newSpent = (budget.spent || 0) + Number(transaction.Amount);
                    await this.budgetModel.update(userId, budget.id, { spent: newSpent });
                    await this.budgetModel.linkTransactionToBudget(userId, budget.id, createdTransaction.id);
                }
            }

            return transformedTransactions;
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