const { DatabaseError } = require('../utils/errors');
const { plaidClient } = require('../config/plaid.config');

class PlaidService {
    constructor(plaidModel) {  // Remove db parameter
        this.plaidModel = plaidModel;
        this.plaidClient = plaidClient;
    }

    async createLinkToken(userId) {
        try {
            const linkTokenResponse = await this.plaidClient.linkTokenCreate({
                user: { client_user_id: userId },
                client_name: 'StudentWallet',
                products: ['auth', 'transactions'],
                country_codes: ['US'],
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

            await this.plaidModel.storeTokens(userId, { accessToken, itemId });
            return { success: true };
        } catch (error) {
            console.error('Error exchanging public token:', error.response?.data || error.message);
            throw new DatabaseError('Could not exchange public token.');
        }
    }

    async fetchTransactions(userId, startDate, endDate) {
        try {
            const tokens = await this.plaidModel.getTokens(userId);
            if (!tokens) {
                throw new DatabaseError('User or access token not found');
            }

            const transactionsResponse = await this.plaidClient.transactionsGet({
                access_token: tokens.accessToken,
                start_date: startDate,
                end_date: endDate,
            });
            return transactionsResponse.data.transactions;
        } catch (error) {
            console.error('Error fetching transactions:', error.response?.data || error.message);
            throw new DatabaseError('Could not fetch transactions.');
        }
    }
}

module.exports = PlaidService;