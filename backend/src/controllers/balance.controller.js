class BalanceController {
    constructor(balanceService) {
        this.balanceService = balanceService;
    }

    async getCurrentBalance(req, res, next) {
        try {
            const { userId } = req.query;
            const balance = await this.balanceService.getCurrentBalance(userId);

            res.status(200).json({
                status: 'success',
                data: balance
            });
        } catch (error) {
            next(error);
        }
    }

    async addToBalance(req, res, next) {
        try {
            const { userId, amount, description } = req.body;
            const updatedBalance = await this.balanceService.addToBalance(userId, amount, description);

            res.status(200).json({
                status: 'success',
                data: updatedBalance
            });
        } catch (error) {
            next(error);
        }
    }

    async deductFromBalance(req, res, next) {
        try {
            const { userId, amount, description } = req.body;
            const updatedBalance = await this.balanceService.deductFromBalance(userId, amount, description);

            res.status(200).json({
                status: 'success',
                data: updatedBalance
            });
        } catch (error) {
            next(error);
        }
    }

    async setInitialBalance(req, res, next) {
        try {
            const { userId, amount } = req.body;
            const balance = await this.balanceService.setInitialBalance(userId, amount);

            res.status(200).json({
                status: 'success',
                data: balance
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BalanceController;