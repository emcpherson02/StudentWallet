const request = require('supertest');
const express = require('express');
const LoanController = require('../controllers/LoanController');

// Mock LoanService
const mockLoanService = {
    addLoan: jest.fn(),
    getLoan: jest.fn(),
    updateLoan: jest.fn(),
    deleteLoan: jest.fn(),
    linkAllTransactions: jest.fn(),
    linkSingleTransaction: jest.fn(),
    unlinkAllTransactions: jest.fn()
};

const app = express();
app.use(express.json());

// Initialize LoanController with mock service
const loanController = new LoanController(mockLoanService);

// Mock routes
app.post('/loan', (req, res, next) => loanController.addLoan(req, res, next));
app.get('/loan', (req, res, next) => loanController.getLoan(req, res, next));
app.put('/loan/:loanId', (req, res, next) => loanController.updateLoan(req, res, next));
app.delete('/loan/:loanId', (req, res, next) => loanController.deleteLoan(req, res, next));
app.post('/loan/:loanId/link-all', (req, res, next) => loanController.linkAllTransactions(req, res, next));
app.post('/loan/:loanId/link-single', (req, res, next) => loanController.linkSingleTransaction(req, res, next));
app.post('/loan/:loanId/unlink-all', (req, res, next) => loanController.unlinkAllTransactions(req, res, next));

describe('LoanController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('addLoan should return success message and loan data', async () => {
        const mockLoan = { id: 1, totalAmount: 5000 };
        mockLoanService.addLoan.mockResolvedValue(mockLoan);

        const response = await request(app)
            .post('/loan')
            .send({ userId: 1, instalmentDates: [], instalmentAmounts: [], livingOption: 'On-campus', totalAmount: 5000 });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            status: 'success',
            message: 'Maintenance loan added successfully',
            data: mockLoan
        });
        expect(mockLoanService.addLoan).toHaveBeenCalled();
    });

    test('getLoan should return loan data', async () => {
        const mockLoan = { id: 1, totalAmount: 5000 };
        mockLoanService.getLoan.mockResolvedValue(mockLoan);

        const response = await request(app).get('/loan').query({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', data: mockLoan });
        expect(mockLoanService.getLoan).toHaveBeenCalledWith(1);
    });

    test('updateLoan should return updated loan data', async () => {
        const mockUpdatedLoan = { id: 1, totalAmount: 6000 };
        mockLoanService.updateLoan.mockResolvedValue(mockUpdatedLoan);

        const response = await request(app).put('/loan/1').send({ userId: 1, totalAmount: 6000 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Maintenance loan updated successfully', data: mockUpdatedLoan });
        expect(mockLoanService.updateLoan).toHaveBeenCalled();
    });

    test('deleteLoan should return success message', async () => {
        mockLoanService.deleteLoan.mockResolvedValue();

        const response = await request(app).delete('/loan/1').send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Maintenance loan deleted successfully' });
        expect(mockLoanService.deleteLoan).toHaveBeenCalled();
    });

    test('linkAllTransactions should return success message', async () => {
        mockLoanService.linkAllTransactions.mockResolvedValue({ linked: true });

        const response = await request(app).post('/loan/1/link-all').send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Transactions linked to loan successfully', data: { linked: true } });
        expect(mockLoanService.linkAllTransactions).toHaveBeenCalled();
    });

    test('linkSingleTransaction should return success message', async () => {
        mockLoanService.linkSingleTransaction.mockResolvedValue({ linked: true });

        const response = await request(app).post('/loan/1/link-single').send({ userId: 1, transactionId: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'Transaction linked to loan successfully', data: { linked: true } });
        expect(mockLoanService.linkSingleTransaction).toHaveBeenCalled();
    });

    test('unlinkAllTransactions should return success message', async () => {
        mockLoanService.unlinkAllTransactions.mockResolvedValue({ unlinked: true });

        const response = await request(app).post('/loan/1/unlink-all').send({ userId: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'success', message: 'All transactions unlinked from loan successfully', data: { unlinked: true } });
        expect(mockLoanService.unlinkAllTransactions).toHaveBeenCalled();
    });
});
