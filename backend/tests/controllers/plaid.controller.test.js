const PlaidController = require('../../src/controllers/plaid.controller');

describe('PlaidController', () => {
    let plaidController;
    let mockPlaidService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockPlaidService = {
            createLinkToken: jest.fn(),
            exchangePublicToken: jest.fn(),
            getAccounts: jest.fn(),
            fetchTransactions: jest.fn(),
            getBalances: jest.fn()
        };

        plaidController = new PlaidController(mockPlaidService);

        mockReq = {
            body: {},
            params: {},
            query: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();

        console.error = jest.fn();
        console.log = jest.fn();
    });

    describe('createLinkToken', () => {
        it('should successfully create a link token', async () => {
            const mockUserId = '123';
            const mockLinkToken = 'link-token-123';
            
            mockReq.body = { userId: mockUserId };
            mockPlaidService.createLinkToken.mockResolvedValue(mockLinkToken);

            await plaidController.createLinkToken(mockReq, mockRes, mockNext);

            expect(mockPlaidService.createLinkToken).toHaveBeenCalledWith(mockUserId);
            expect(mockRes.json).toHaveBeenCalledWith({ linkToken: mockLinkToken });
        });

        it('should handle errors when creating link token', async () => {
            const mockError = new Error('Failed to create link token');
            mockPlaidService.createLinkToken.mockRejectedValue(mockError);

            await plaidController.createLinkToken(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('exchangePublicToken', () => {
        it('should successfully exchange public token', async () => {
            const mockData = {
                publicToken: 'public-token-123',
                userId: '123'
            };
            const mockResult = {
                accounts: [
                    { id: 'acc1', name: 'Checking' },
                    { id: 'acc2', name: 'Savings' }
                ]
            };
            
            mockReq.body = mockData;
            mockPlaidService.exchangePublicToken.mockResolvedValue(mockResult);

            await plaidController.exchangePublicToken(mockReq, mockRes, mockNext);

            expect(mockPlaidService.exchangePublicToken).toHaveBeenCalledWith(
                mockData.publicToken,
                mockData.userId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Public token exchanged and stored successfully!',
                accounts: mockResult.accounts
            });
        });

        it('should handle errors when exchanging public token', async () => {
            const mockError = new Error('Token exchange failed');
            mockPlaidService.exchangePublicToken.mockRejectedValue(mockError);

            await plaidController.exchangePublicToken(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getAccounts', () => {
        it('should successfully get accounts', async () => {
            const mockUserId = '123';
            const mockAccounts = [
                { id: 'acc1', name: 'Checking', balance: 1000 },
                { id: 'acc2', name: 'Savings', balance: 5000 }
            ];
            
            mockReq.params = { userId: mockUserId };
            mockPlaidService.getAccounts.mockResolvedValue(mockAccounts);

            await plaidController.getAccounts(mockReq, mockRes, mockNext);

            expect(mockPlaidService.getAccounts).toHaveBeenCalledWith(mockUserId);
            expect(mockRes.json).toHaveBeenCalledWith({ accounts: mockAccounts });
        });

        it('should handle errors when getting accounts', async () => {
            const mockError = new Error('Failed to get accounts');
            mockPlaidService.getAccounts.mockRejectedValue(mockError);

            await plaidController.getAccounts(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getTransactions', () => {
        it('should successfully get transactions', async () => {
            const mockParams = {
                userId: '123',
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };
            const mockTransactions = [
                { id: 'trans1', amount: 50, description: 'Groceries' },
                { id: 'trans2', amount: 30, description: 'Gas' }
            ];
            
            mockReq.params = { userId: mockParams.userId };
            mockReq.query = {
                startDate: mockParams.startDate,
                endDate: mockParams.endDate
            };
            mockPlaidService.fetchTransactions.mockResolvedValue(mockTransactions);

            await plaidController.getTransactions(mockReq, mockRes, mockNext);

            expect(mockPlaidService.fetchTransactions).toHaveBeenCalledWith(
                mockParams.userId,
                mockParams.startDate,
                mockParams.endDate
            );
            expect(mockRes.json).toHaveBeenCalledWith({ transactions: mockTransactions });
            expect(console.log).toHaveBeenCalledWith('Received request for transactions:', {
                userId: mockParams.userId,
                startDate: mockParams.startDate,
                endDate: mockParams.endDate
            });
        });

        it('should handle errors when getting transactions', async () => {
            const mockError = new Error('Failed to fetch transactions');
            mockPlaidService.fetchTransactions.mockRejectedValue(mockError);

            await plaidController.getTransactions(mockReq, mockRes, mockNext);

            expect(console.error).toHaveBeenCalledWith('Transaction fetch error:', mockError);
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getBalances', () => {
        it('should successfully get balances', async () => {
            const mockUserId = '123';
            const mockBalances = {
                totalBalance: 6000,
                accounts: [
                    { id: 'acc1', balance: 1000 },
                    { id: 'acc2', balance: 5000 }
                ]
            };
            
            mockReq.params = { userId: mockUserId };
            mockPlaidService.getBalances.mockResolvedValue(mockBalances);

            await plaidController.getBalances(mockReq, mockRes, mockNext);

            expect(mockPlaidService.getBalances).toHaveBeenCalledWith(mockUserId);
            expect(mockRes.json).toHaveBeenCalledWith({ balances: mockBalances });
        });

        it('should handle errors when getting balances', async () => {
            const mockError = new Error('Failed to get balances');
            mockPlaidService.getBalances.mockRejectedValue(mockError);

            await plaidController.getBalances(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
});