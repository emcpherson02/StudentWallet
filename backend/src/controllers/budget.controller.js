class BudgetController {
    constructor(budgetService) {
        this.budgetService = budgetService;
    }

    async addBudget(req, res, next) {
        try {
            const { userId, category, amount, period, startDate, endDate } = req.body;

            const budget = await this.budgetService.addBudget(userId, {
                category,
                amount,
                period,
                startDate,
                endDate
            });

            res.status(201).json({
                status: 'success',
                message: 'Budget added successfully',
                data: budget
            });
        } catch (error) {
            next(error);
        }
    }

    async getBudgets(req, res, next) {
        try {
            const { userId } = req.query;
            const budgets = await this.budgetService.getBudgets(userId);

            res.status(200).json({
                status: 'success',
                budgets
            });
        } catch (error) {
            next(error);
        }
    }

    async updateBudget(req, res, next) {
        try {
            const { userId, category, amount, period, spent, startDate, endDate } = req.body;
            const { budgetId } = req.params;

            const updatedBudget = await this.budgetService.updateBudget(
                userId,
                budgetId,
                { category, amount, period, spent, startDate, endDate }
            );

            res.status(200).json({
                status: 'success',
                message: 'Budget updated successfully',
                data: updatedBudget
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteBudget(req, res, next) {
        try {
            const { userId } = req.body;
            const { budgetId } = req.params;

            await this.budgetService.deleteBudget(userId, budgetId);

            res.status(200).json({
                status: 'success',
                message: 'Budget deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BudgetController;