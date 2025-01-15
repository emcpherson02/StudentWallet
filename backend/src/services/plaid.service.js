const { DatabaseError } = require('../utils/errors');
const { plaidClient, plaidSettings } = require('../config/plaid.config');

class PlaidService {
    constructor(db) {
        this.db = db;
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
            // Exchange public token
            const tokenResponse = await this.plaidClient.itemPublicTokenExchange({
                public_token: publicToken
            });

            const { access_token: accessToken, item_id: itemId } = tokenResponse.data;

            // Store tokens
            await this.db.collection('plaid_tokens').doc(userId).set({
                linkedBank: true,
                accessToken,
                itemId,
                createdAt: new Date(),
            });

            return { success: true };
        } catch (error) {
            console.error('Error exchanging public token:', error.response?.data || error.message);
            throw new DatabaseError('Could not exchange public token.');
        }
    }

    async fetchTransactions(accessToken, startDate, endDate) {
        try {
            const transactionsResponse = await this.plaidClient.transactionsGet({
                access_token: accessToken,
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