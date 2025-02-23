const express = require('express');
const request = require('supertest');
const setupLoanRoutes = require('../../../src/routes/loan.routes');

jest.mock('../../../src/middleware/auth.middleware');

describe('Loan Routes', () => {
    let app;
    let mockLoanController;
    let mockAuthMiddleware;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        jest.clearAllMocks();

        mockLoanController = {
            addLoan: jest.fn((req, res) => res.json({ success: true })),
            getLoan: jest.fn((req, res) => res.json({ loan: {} })),
            updateLoan: jest.fn((req, res) => res.json({ success: true })),
            deleteLoan: jest.fn((req, res) => res.json({ success: true })),
            linkAllTransactions: jest.fn((req, res) => res.json({ success: true })),
            unlinkAllTransactions: jest.fn((req, res) => res.json({ success: true })),
            linkSingleTransaction: jest.fn((req, res) => res.json({ success: true }))
        };

        mockAuthMiddleware = {
            verifyToken: jest.fn((req, res, next) => next())
        };

        const router = express.Router();
        app.use('/loan', setupLoanRoutes(router, mockLoanController, mockAuthMiddleware));
    });

    describe('POST /loan/add_loan', () => {
        const testLoan = {
            totalAmount: 5000,
            startDate: '2025-01-01',
            endDate: '2025-12-31'
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/loan/add_loan')
                .send(testLoan);

            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should create loan', async () => {
            await request(app)
                .post('/loan/add_loan')
                .send(testLoan);

            expect(mockLoanController.addLoan).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/loan/add_loan')
                .send(testLoan);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('GET /loan/get_loan', () => {
        it('should verify authentication', async () => {
            await request(app).get('/loan/get_loan');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should fetch loan', async () => {
            await request(app).get('/loan/get_loan');
            expect(mockLoanController.getLoan).toHaveBeenCalled();
        });

        it('should return loan data', async () => {
            const response = await request(app).get('/loan/get_loan');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ loan: {} });
        });
    });

    describe('PUT /loan/update_loan/:loanId', () => {
        const testUpdate = {
            totalAmount: 6000
        };

        it('should verify authentication', async () => {
            await request(app)
                .put('/loan/update_loan/123')
                .send(testUpdate);
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should update loan', async () => {
            await request(app)
                .put('/loan/update_loan/123')
                .send(testUpdate);
            expect(mockLoanController.updateLoan).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .put('/loan/update_loan/123')
                .send(testUpdate);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('DELETE /loan/delete_loan/:loanId', () => {
        it('should verify authentication', async () => {
            await request(app).delete('/loan/delete_loan/123');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should delete loan', async () => {
            await request(app).delete('/loan/delete_loan/123');
            expect(mockLoanController.deleteLoan).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).delete('/loan/delete_loan/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('POST /loan/link_all_transactions/:loanId', () => {
        it('should verify authentication', async () => {
            await request(app).post('/loan/link_all_transactions/123');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should link transactions', async () => {
            await request(app).post('/loan/link_all_transactions/123');
            expect(mockLoanController.linkAllTransactions).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).post('/loan/link_all_transactions/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('DELETE /loan/unlink_all_transactions/:loanId', () => {
        it('should verify authentication', async () => {
            await request(app).delete('/loan/unlink_all_transactions/123');
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should unlink transactions', async () => {
            await request(app).delete('/loan/unlink_all_transactions/123');
            expect(mockLoanController.unlinkAllTransactions).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app).delete('/loan/unlink_all_transactions/123');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });

    describe('POST /loan/link_transaction/:loanId', () => {
        const testTransaction = {
            transactionId: '456',
            amount: 100
        };

        it('should verify authentication', async () => {
            await request(app)
                .post('/loan/link_transaction/123')
                .send(testTransaction);
            expect(mockAuthMiddleware.verifyToken).toHaveBeenCalled();
        });

        it('should link single transaction', async () => {
            await request(app)
                .post('/loan/link_transaction/123')
                .send(testTransaction);
            expect(mockLoanController.linkSingleTransaction).toHaveBeenCalled();
        });

        it('should return success response', async () => {
            const response = await request(app)
                .post('/loan/link_transaction/123')
                .send(testTransaction);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
        });
    });
});