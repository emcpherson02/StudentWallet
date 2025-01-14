const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { DatabaseError } = require('../utils/errors');

class PlaidService {
    constructor(db) {
        this.db = db;
        this.plaidClient = new PlaidApi(
            new Configuration({
                basePath: PlaidEnvironments.sandbox,
                baseOptions: {
                    headers: {
                        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                        'PLAID-SECRET': process.env.PLAID_SECRET,
                        'Plaid-Version': '2020-09-14',
                    },
                },
            })
        );
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
            // Exchange public token - exact same logic as original
            const tokenResponse = await this.plaidClient.itemPublicTokenExchange({
                public_token: publicToken
            });

            const { access_token: accessToken, item_id: itemId } = tokenResponse.data;

            // Store tokens - exact same logic as original
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
            // Exact same logic as original
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