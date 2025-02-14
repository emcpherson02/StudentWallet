const request = require('supertest');
const express = require('express');
const PlaidController = require('../controllers/PlaidController');

// Mock PlaidService
const mockPlaidService = {
    createLinkToken: jest.fn(),
    exchangePublicToken: jest.fn(),
    getAccounts: jest.fn(),
    fetchTransactions: jest.fn(),
    getBalances: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize PlaidController with mock service
const plaidController = new PlaidController(mockPlaidService);

// Mock routes
app.post('/plaid/link-token', (req, res, next) => plaidController.createLinkToken(req, res, next));
app.post('/plaid/exchange-token', (req, res, next) => plaidController.exchangePublicToken(req, res, next));
app.get('/plaid/accounts/:userId', (req, res, next) => plaidController.getAccounts(req, res, next));
app.get('/plaid/transactions/:userId', (req, res, next) => plaidController.getTransactions(req, res, next));
app.get('/plaid/balances/:userId', (req, res, next) => plaidController.getBalances(req, res, next));

describe('PlaidController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('createLinkToken should return a link token', async () => {
        mockPlaidService.createLinkToken.mockResolvedValue('mock_link_token');

        const response = await request(app)
            .post('/plaid/link-token')
            .send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ linkToken: 'mock_link_token' });
        expect(mockPlaidService.createLinkToken).toHaveBeenCalledWith(1);
    });

    test('exchangePublicToken should return success message and accounts', async () => {
        const mockAccounts = [{ id: '123', name: 'Checking' }];
        mockPlaidService.exchangePublicToken.mockResolvedValue({ accounts: mockAccounts });

        const response = await request(app)
            .post('/plaid/exchange-token')
            .send({ publicToken: 'mock_public_token', userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Public token exchanged and stored successfully!', accounts: mockAccounts });
        expect(mockPlaidService.exchangePublicToken).toHaveBeenCalledWith('mock_public_token', 1);
    });

    test('getAccounts should return user accounts', async () => {
        const mockAccounts = [{ id: '123', name: 'Savings' }];
        mockPlaidService.getAccounts.mockResolvedValue(mockAccounts);

        const response = await request(app).get('/plaid/accounts/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ accounts: mockAccounts });
        expect(mockPlaidService.getAccounts).toHaveBeenCalledWith('1');
    });

    test('getTransactions should return user transactions', async () => {
        const mockTransactions = [{ id: 'txn_1', amount: 100 }];
        mockPlaidService.fetchTransactions.mockResolvedValue(mockTransactions);

        const response = await request(app)
            .get('/plaid/transactions/1')
            .query({ startDate: '2024-01-01', endDate: '2024-02-01' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ transactions: mockTransactions });
        expect(mockPlaidService.fetchTransactions).toHaveBeenCalledWith('1', '2024-01-01', '2024-02-01');
    });

    test('getBalances should return user balances', async () => {
        const mockBalances = { checking: 500, savings: 1000 };
        mockPlaidService.getBalances.mockResolvedValue(mockBalances);

        const response = await request(app).get('/plaid/balances/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ balances: mockBalances });
        expect(mockPlaidService.getBalances).toHaveBeenCalledWith('1');
    });
});