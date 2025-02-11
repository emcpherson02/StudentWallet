class BudgetHistoryController {
    constructor(budgetRolloverService, budgetAnalyticsService) {
        this.budgetRolloverService = budgetRolloverService;
        this.budgetAnalyticsService = budgetAnalyticsService;
    }

    async processRollover(req, res, next) {
        try {
            const { userId, budgetId } = req.body;
            const result = await this.budgetRolloverService.processRollover(
                userId,
                budgetId
            );

            res.status(200).json({
                status: 'success',
                message: 'Budget rolled over successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getAnalytics(req, res, next) {
        try {
            const { userId, category } = req.query;
            const { startDate, endDate } = req.query;

            const analytics = await this.budgetAnalyticsService.generateAnalytics(
                userId,
                category,
                startDate,
                endDate
            );

            res.status(200).json({
                status: 'success',
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BudgetHistoryController;