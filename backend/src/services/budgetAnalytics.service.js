class BudgetAnalyticsService {
    constructor(budgetHistoryModel) {
        this.budgetHistoryModel = budgetHistoryModel;
    }

    async generateAnalytics(userId, category, startDate, endDate) {
        const history = await this.budgetHistoryModel.findByCategory(
            userId,
            category,
            startDate,
            endDate
        );

        const trends = this.analyzeTrends(history);
        const recommendations = this.generateRecommendations(trends);

        return {
            trends,
            recommendations,
            summary: this.generateSummary(history)
        };
    }

    analyzeTrends(history) {
        const utilization = history.map(record => ({
            period: record.period,
            utilizationPercentage: record.utilizationPercentage,
            date: record.endDate
        }));

        const rolloverTrends = history.map(record => ({
            period: record.period,
            rolloverAmount: record.rolloverAmount,
            date: record.endDate
        }));

        const spentTrends = history.map(record => ({
            period: record.period,
            actualSpent: record.actualSpent,
            date: record.endDate
        }));

        return {
            utilization,
            rolloverTrends,
            spentTrends,
            averageUtilization: this.calculateAverage(
                utilization.map(u => u.utilizationPercentage)
            )
        };
    }

    generateRecommendations(trends) {
        const recommendations = [];

        if (trends.averageUtilization > 90) {
            recommendations.push({
                type: 'INCREASE_BUDGET',
                message: 'Consider increasing budget as utilization is consistently high'
            });
        } else if (trends.averageUtilization < 70) {
            recommendations.push({
                type: 'DECREASE_BUDGET',
                message: 'Consider reducing budget as significant amounts are not being spent'
            });
        }

        return recommendations;
    }

    generateSummary(history) {
        return {
            totalPeriods: history.length,
            totalSpent: history.reduce((sum, record) => sum + record.actualSpent, 0),
            averageSpent: this.calculateAverage(
                history.map(record => record.actualSpent)
            ),
            totalRollovers: history.reduce(
                (sum, record) => sum + (record.rolloverAmount || 0),
                0
            )
        };
    }

    calculateAverage(numbers) {
        return numbers.length > 0
            ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length
            : 0;
    }
}

module.exports = BudgetAnalyticsService;