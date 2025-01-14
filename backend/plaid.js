const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const plaidClient = new PlaidApi(
    new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
}));

// Create a link token
const createLinkToken = async (userId) => {
    try {
        const linkTokenResponse = await plaidClient.linkTokenCreate({
            user: {
                client_user_id: userId, // Unique identifier for the user
            },
            client_name: 'StudentWallet',
            products: ['auth', 'transactions'],
            country_codes: ['US'],
            language: 'en',
        });
        return linkTokenResponse.data.link_token;
    } catch (error) {
        console.error('Error creating link token:', error.response?.data || error.message);
        throw new Error('Could not create link token.');
    }
};

// Exchange public token for access token
const exchangePublicToken = async (publicToken) => {
    try {
        const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
        return tokenResponse.data;
    } catch (error) {
        console.error('Error exchanging public token:', error.response?.data || error.message);
        throw new Error('Could not exchange public token.');
    }
};

// Fetch transactions
const fetchTransactions = async (accessToken, startDate, endDate) => {
    try {
        const transactionsResponse = await plaidClient.transactionsGet({
            access_token: accessToken,
            start_date: startDate,
            end_date: endDate,
        });
        return transactionsResponse.data.transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error.response?.data || error.message);
        throw new Error('Could not fetch transactions.');
    }
};

module.exports = { createLinkToken, exchangePublicToken, fetchTransactions };