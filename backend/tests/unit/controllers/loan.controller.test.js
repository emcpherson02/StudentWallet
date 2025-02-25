const LoanController = require('../../../src/controllers/loan.controller');

describe('LoanController', () => {
    let loanController;
    let mockLoanService;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockLoanService = {
            addLoan: jest.fn(),
            getLoan: jest.fn(),
            updateLoan: jest.fn(),
            deleteLoan: jest.fn(),
            linkAllTransactions: jest.fn(),
            linkSingleTransaction: jest.fn(),
            unlinkAllTransactions: jest.fn()
        };

        loanController = new LoanController(mockLoanService);

        mockReq = {
            body: {},
            query: {},
            params: {}
        };

        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('addLoan', () => {
        it('should successfully add a loan', async () => {
            const mockLoanData = {
                userId: '123',
                instalmentDates: ['2024-01-01', '2024-04-01'],
                instalmentAmounts: [3000, 3000],
                livingOption: 'home',
                totalAmount: 6000
            };
            const mockLoanResponse = { id: '1', ...mockLoanData };
            
            mockReq.body = mockLoanData;
            mockLoanService.addLoan.mockResolvedValue(mockLoanResponse);

            await loanController.addLoan(mockReq, mockRes, mockNext);

            expect(mockLoanService.addLoan).toHaveBeenCalledWith(
                mockLoanData.userId,
                {
                    instalmentDates: mockLoanData.instalmentDates,
                    instalmentAmounts: mockLoanData.instalmentAmounts,
                    livingOption: mockLoanData.livingOption,
                    totalAmount: mockLoanData.totalAmount
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Maintenance loan added successfully',
                data: mockLoanResponse
            });
        });

        it('should handle errors when adding loan', async () => {
            const mockError = new Error('Failed to add loan');
            mockLoanService.addLoan.mockRejectedValue(mockError);

            await loanController.addLoan(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('getLoan', () => {
        it('should successfully get a loan', async () => {
            const userId = '123';
            const mockLoan = {
                id: '1',
                instalmentDates: ['2024-01-01'],
                totalAmount: 6000
            };
            
            mockReq.query = { userId };
            mockLoanService.getLoan.mockResolvedValue(mockLoan);

            await loanController.getLoan(mockReq, mockRes, mockNext);

            expect(mockLoanService.getLoan).toHaveBeenCalledWith(userId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: mockLoan
            });
        });

        it('should handle errors when getting loan', async () => {
            const mockError = new Error('Failed to get loan');
            mockLoanService.getLoan.mockRejectedValue(mockError);

            await loanController.getLoan(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('updateLoan', () => {
        it('should successfully update a loan', async () => {
            const mockUpdateData = {
                userId: '123',
                instalmentDates: ['2024-01-01', '2024-04-01'],
                instalmentAmounts: [3500, 3500],
                livingOption: 'away',
                totalAmount: 7000
            };
            const loanId = '456';
            const mockUpdatedLoan = { id: loanId, ...mockUpdateData };
            
            mockReq.body = mockUpdateData;
            mockReq.params = { loanId };
            mockLoanService.updateLoan.mockResolvedValue(mockUpdatedLoan);

            await loanController.updateLoan(mockReq, mockRes, mockNext);

            expect(mockLoanService.updateLoan).toHaveBeenCalledWith(
                mockUpdateData.userId,
                loanId,
                {
                    instalmentDates: mockUpdateData.instalmentDates,
                    instalmentAmounts: mockUpdateData.instalmentAmounts,
                    livingOption: mockUpdateData.livingOption,
                    totalAmount: mockUpdateData.totalAmount
                }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Maintenance loan updated successfully',
                data: mockUpdatedLoan
            });
        });
    });

    describe('deleteLoan', () => {
        it('should successfully delete a loan', async () => {
            const mockDeleteData = {
                userId: '123',
                loanId: '456'
            };
            
            mockReq.body = { userId: mockDeleteData.userId };
            mockReq.params = { loanId: mockDeleteData.loanId };
            mockLoanService.deleteLoan.mockResolvedValue(true);

            await loanController.deleteLoan(mockReq, mockRes, mockNext);

            expect(mockLoanService.deleteLoan).toHaveBeenCalledWith(
                mockDeleteData.userId,
                mockDeleteData.loanId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Maintenance loan deleted successfully'
            });
        });
    });

    describe('linkAllTransactions', () => {
        it('should successfully link all transactions', async () => {
            const mockData = {
                userId: '123',
                loanId: '456'
            };
            const mockResult = {
                linkedTransactions: ['789', '012']
            };
            
            mockReq.body = { userId: mockData.userId };
            mockReq.params = { loanId: mockData.loanId };
            mockLoanService.linkAllTransactions.mockResolvedValue(mockResult);

            await loanController.linkAllTransactions(mockReq, mockRes, mockNext);

            expect(mockLoanService.linkAllTransactions).toHaveBeenCalledWith(
                mockData.userId,
                mockData.loanId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transactions linked to loan successfully',
                data: mockResult
            });
        });
    });

    describe('linkSingleTransaction', () => {
        it('should successfully link a single transaction', async () => {
            const mockData = {
                userId: '123',
                loanId: '456',
                transactionId: '789'
            };
            const mockResult = {
                linkedTransaction: '789'
            };
            
            mockReq.body = { 
                userId: mockData.userId,
                transactionId: mockData.transactionId 
            };
            mockReq.params = { loanId: mockData.loanId };
            mockLoanService.linkSingleTransaction.mockResolvedValue(mockResult);

            await loanController.linkSingleTransaction(mockReq, mockRes, mockNext);

            expect(mockLoanService.linkSingleTransaction).toHaveBeenCalledWith(
                mockData.userId,
                mockData.loanId,
                mockData.transactionId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'Transaction linked to loan successfully',
                data: mockResult
            });
        });
    });

    describe('unlinkAllTransactions', () => {
        it('should successfully unlink all transactions', async () => {
            const mockData = {
                userId: '123',
                loanId: '456'
            };
            const mockResult = {
                unlinkedTransactions: ['789', '012']
            };
            
            mockReq.body = { userId: mockData.userId };
            mockReq.params = { loanId: mockData.loanId };
            mockLoanService.unlinkAllTransactions.mockResolvedValue(mockResult);

            await loanController.unlinkAllTransactions(mockReq, mockRes, mockNext);

            expect(mockLoanService.unlinkAllTransactions).toHaveBeenCalledWith(
                mockData.userId,
                mockData.loanId
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                message: 'All transactions unlinked from loan successfully',
                data: mockResult
            });
        });
    });
});