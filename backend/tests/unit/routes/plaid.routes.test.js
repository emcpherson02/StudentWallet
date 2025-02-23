const express = require('express');
const request = require('supertest');
const setupPlaidRoutes = require('../../../src/routes/plaid.routes');

jest.mock('../../../src/middleware/auth.middleware');

describe('Plaid Routes', () => {
    let app;
    let mockPlaidController;
    let mockAuthMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockPlaidController = {
            createLinkToken: jest.fn((req, res) => res.json({ linkToken: 'test-link-token' })),
            exchangePublicToken: jest.fn((req, res) => res.json({ 
                message: 'Token exchanged successfully',
                accounts: []
            })),
            getAccounts: jest.fn((req, res) => res.json({ accounts: [] })),
            getTransactions: jest.fn((req, res) => res.json({ transactions: [] })),
            getBalances: jest.fn((req, res) => res.json({ balances: [] }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        const router = express.Router();
        app.use('/plaid', setupPlaidRoutes(router, mockPlaidController, mockAuthMiddleware));
    });

    describe('POST /plaid/create_link_token', () => {
        const testData = {
            userId: 'test-user-id'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/plaid/create_link_token')
                .send(testData);

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should create link token', async () => {
            await request(app)
                .post('/plaid/create_link_token')
                .send(testData);

            expect(mockPlaidController.createLinkToken).toHaveBeenCalled();
        });

        it('should return link token', async () => {
            const response = await request(app)
                .post('/plaid/create_link_token')
                .send(testData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ linkToken: 'test-link-token' });
        });
    });

    describe('POST /plaid/exchange_public_token', () => {
        const testData = {
            publicToken: 'test-public-token',
            userId: 'test-user-id'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/plaid/exchange_public_token')
                .send(testData);

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should exchange token', async () => {
            await request(app)
                .post('/plaid/exchange_public_token')
                .send(testData);

            expect(mockPlaidController.exchangePublicToken).toHaveBeenCalled();
        });

        it('should return success message and accounts', async () => {
            const response = await request(app)
                .post('/plaid/exchange_public_token')
                .send(testData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'Token exchanged successfully',
                accounts: []
            });
        });
    });

    describe('GET /plaid/accounts/:userId', () => {
        it('should verify authentication', async () => {
            await request(app).get('/plaid/accounts/test-user-id');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch accounts', async () => {
            await request(app).get('/plaid/accounts/test-user-id');
            expect(mockPlaidController.getAccounts).toHaveBeenCalled();
        });

        it('should return accounts list', async () => {
            const response = await request(app).get('/plaid/accounts/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ accounts: [] });
        });
    });

    describe('GET /plaid/transactions/:userId', () => {
        it('should verify authentication', async () => {
            await request(app)
                .get('/plaid/transactions/test-user-id')
                .query({ startDate: '2025-01-01', endDate: '2025-02-01' });
            
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch transactions', async () => {
            await request(app)
                .get('/plaid/transactions/test-user-id')
                .query({ startDate: '2025-01-01', endDate: '2025-02-01' });

            expect(mockPlaidController.getTransactions).toHaveBeenCalled();
        });

        it('should return transactions list', async () => {
            const response = await request(app)
                .get('/plaid/transactions/test-user-id')
                .query({ startDate: '2025-01-01', endDate: '2025-02-01' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ transactions: [] });
        });

        it('should handle missing date parameters', async () => {
            const response = await request(app)
                .get('/plaid/transactions/test-user-id');

            expect(response.status).toBe(200);
            expect(mockPlaidController.getTransactions).toHaveBeenCalled();
        });
    });

    describe('GET /plaid/balances/:userId', () => {
        it('should verify authentication', async () => {
            await request(app).get('/plaid/balances/test-user-id');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch balances', async () => {
            await request(app).get('/plaid/balances/test-user-id');
            expect(mockPlaidController.getBalances).toHaveBeenCalled();
        });

        it('should return balances list', async () => {
            const response = await request(app).get('/plaid/balances/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ balances: [] });
        });
    });
});