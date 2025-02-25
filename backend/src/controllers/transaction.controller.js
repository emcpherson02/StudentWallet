class TransactionController {
    constructor(transactionService, transactionModel) {
        this.transactionService = transactionService;
        this.transactionModel = transactionModel;
    }

    async addTransaction(req, res, next) {
        try {
            const { userId, amount,category, date, description } = req.body;

            const transaction = await this.transactionService.addTransaction(
                userId,
                { amount,category ,date, description }
            );

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

    async getTransactionAnalytics(req, res, next) {
        try {
            const { userId } = req.query;
            const analytics = await this.transactionService.getTransactionAnalytics(userId);

            res.status(200).json({
                status: 'success',
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { userId, transactionId, category, budgetId } = req.body;

            const updatedTransaction = await this.transactionService.updateCategory(
                userId,
                transactionId,
                category,
                budgetId
            );

            res.status(200).json({
                status: 'success',
                message: 'Transaction category updated successfully',
                data: updatedTransaction
            });
        } catch (error) {
            next(error);
        }
    }

    async getInsights(req, res, next) {
        try {
            const { userId } = req.query;
            const insights = await this.transactionService.getInsights(userId);
            res.status(200).json({
                status: 'success',
                data: insights
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TransactionController;