class TransactionController {
    constructor(transactionService, transactionModel) {
        this.transactionService = transactionService;
        this.transactionModel = transactionModel;
    }

    async addTransaction(req, res, next) {
        try {
            const { userId, amount, category, date, description, transactionType } = req.body;

            const transaction = await this.transactionService.addTransaction(userId, {
                amount,
                category,
                date,
                description,
                transactionType
            });

            res.status(200).json({
                status: 'success',
                message: 'Transaction added successfully',
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserTransactions(req, res, next) {
        try {
            const { userId } = req.query;
            const transactions = await this.transactionService.getUserTransactions(userId);

            res.json({
                linkedBank: true,
                Transaction: transactions
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTransaction(req, res, next) {
        try {
            const { transactionId } = req.params;
            const { userId } = req.body;

            await this.transactionService.deleteTransaction(userId, transactionId);

            res.status(200).json({
                status: 'success',
                message: 'Transaction deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TransactionController;