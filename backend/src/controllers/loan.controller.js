class LoanController {
    constructor(loanService) {
        this.loanService = loanService;
    }

    async addLoan(req, res, next) {
        try {
            const { userId, instalmentDates, instalmentAmounts, livingOption, totalAmount } = req.body;

            const loan = await this.loanService.addLoan(
                userId,
                { instalmentDates, instalmentAmounts, livingOption, totalAmount }
            );

            res.status(201).json({
                status: 'success',
                message: 'Maintenance loan added successfully',
                data: loan
            });
        } catch (error) {
            next(error);
        }
    }

    async getLoan(req, res, next) {
        try {
            const { userId } = req.query;
            const loan = await this.loanService.getLoan(userId);

            res.status(200).json({
                status: 'success',
                data: loan
            });
        } catch (error) {
            next(error);
        }
    }

    async updateLoan(req, res, next) {
        try {
            const { userId, instalmentDates, instalmentAmounts, livingOption, totalAmount } = req.body;
            const { loanId } = req.params;

            const updatedLoan = await this.loanService.updateLoan(
                userId,
                loanId,
                { instalmentDates, instalmentAmounts, livingOption, totalAmount }
            );

            res.status(200).json({
                status: 'success',
                message: 'Maintenance loan updated successfully',
                data: updatedLoan
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteLoan(req, res, next) {
        try {
            const { userId } = req.body;
            const { loanId } = req.params;

            await this.loanService.deleteLoan(userId, loanId);

            res.status(200).json({
                status: 'success',
                message: 'Maintenance loan deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async linkAllTransactions(req, res, next) {
        try {
            const { userId } = req.body;
            const { loanId } = req.params;

            const result = await this.loanService.linkAllTransactions(userId, loanId);

            res.status(200).json({
                status: 'success',
                message: 'Transactions linked to loan successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async linkSingleTransaction(req, res, next) {
        try {
            const { userId, transactionId } = req.body;
            const { loanId } = req.params;

            const result = await this.loanService.linkSingleTransaction(userId, loanId, transactionId);

            res.status(200).json({
                status: 'success',
                message: 'Transaction linked to loan successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async unlinkAllTransactions(req, res, next) {
        try {
            const { userId } = req.body;
            const { loanId } = req.params;

            const result = await this.loanService.unlinkAllTransactions(userId, loanId);

            res.status(200).json({
                status: 'success',
                message: 'All transactions unlinked from loan successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = LoanController;