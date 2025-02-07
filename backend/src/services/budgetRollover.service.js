class BudgetRolloverService {
    constructor(budgetModel, budgetHistoryModel, notificationService) {
        this.budgetModel = budgetModel;
        this.budgetHistoryModel = budgetHistoryModel;
        this.notificationService = notificationService;
    }

    async processRollover(userId, budgetId) {
        try {
            const budget = await this.budgetModel.findById(userId, budgetId);
            if (!budget) {
                throw new NotFoundError('Budget not found');
            }

            // Calculate rollover amount
            const unspentAmount = budget.amount - budget.spent;
            const utilizationPercentage = (budget.spent / budget.amount) * 100;

            // Create history record
            await this.budgetHistoryModel.create(userId, {
                budgetId: budget.id,
                category: budget.category,
                period: budget.period,
                startDate: budget.startDate,
                endDate: budget.endDate,
                originalAmount: budget.amount,
                actualSpent: budget.spent,
                unspentAmount,
                utilizationPercentage,
                trackedTransactions: budget.trackedTransactions || [],
                status: utilizationPercentage > 100 ? 'EXCEEDED' : 'WITHIN_LIMIT'
            });

            // Calculate next period dates
            const nextPeriodDates = this.calculateNextPeriodDates(
                budget.period,
                new Date(budget.endDate)
            );

            // Update budget for next period
            return await this.budgetModel.update(userId, budgetId, {
                startDate: nextPeriodDates.startDate,
                endDate: nextPeriodDates.endDate,
                amount: budget.amount,
                spent: 0,
                trackedTransactions: []
            });
        } catch (error) {
            throw new DatabaseError('Failed to process budget rollover');
        }
    }

    calculateNextPeriodDates(period, currentEndDate) {
        const nextDay = new Date(currentEndDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let endDate = new Date(nextDay);
        switch (period.toLowerCase()) {
            case 'weekly':
                endDate.setDate(endDate.getDate() + 6);
                break;
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(endDate.getDate() - 1);
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                endDate.setDate(endDate.getDate() - 1);
                break;
        }

        return {
            startDate: nextDay.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }
}

module.exports = BudgetRolloverService;