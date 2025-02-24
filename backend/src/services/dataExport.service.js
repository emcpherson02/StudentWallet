class DataExportService {
    constructor(userModel, transactionModel, budgetModel, loanModel, budgetHistoryModel) {
        this.userModel = userModel;
        this.transactionModel = transactionModel;
        this.budgetModel = budgetModel;
        this.loanModel = loanModel;
        this.budgetHistoryModel = budgetHistoryModel;
    }

    async generateExport(decodedToken, filters) {
        try {
            const userId = decodedToken.uid;

            // Get filtered data based on date range
            const [
                userData,
                transactions,
                currentBudgets,
                loanData,
                filteredBudgetHistory
            ] = await Promise.all([
                this.userModel.db.collection('users').doc(userId).get(),
                this.transactionModel.findByUserId(userId),
                this.budgetModel.findByUserId(userId),
                this.loanModel.findByUserId(userId),
                this.budgetHistoryModel.findByPeriod(userId, filters.startDate, filters.endDate)
            ]);

            // Get complete budget history for analytics only
            const allBudgetHistory = await this.getAllBudgetHistory(userId);
            const analytics = this.calculateAnalytics(allBudgetHistory);

            return {
                json: {
                    exportDate: new Date().toISOString(),
                    userProfile: userData.exists ? userData.data() : null,
                    currentBudgetSummary: currentBudgets,
                    historicalBudgetSummary: filteredBudgetHistory,
                    budgetAnalytics: analytics,
                    transactions: transactions,
                    loanInformation: loanData
                },
                csv: this.generateCSVExports({
                    transactions,
                    currentBudgets,
                    budgetHistory: filteredBudgetHistory,
                    budgetAnalytics: analytics,
                    loanData
                })
            };
        } catch (error) {
            console.error('Error generating data export:', error);
            throw new Error('Failed to generate data export');
        }
    }

    async getAllBudgetHistory(userId) {
        const snapshot = await this.budgetHistoryModel.db
            .collection('users')
            .doc(userId)
            .collection('BudgetHistory')
            .get();

        let allHistory = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.records) {
                Object.values(data.records).forEach(record => {
                    allHistory.push({
                        ...record,
                        category: data.category
                    });
                });
            }
        });

        return allHistory;
    }

    calculateAnalytics(budgetHistory) {
        const analytics = {};

        budgetHistory.forEach(record => {
            if (!analytics[record.category]) {
                analytics[record.category] = {
                    category: record.category,
                    totalSpent: 0,
                    totalPlanned: 0,
                    utilization: [],
                    monthlyAverages: {},
                    rollovers: 0,
                    trends: {
                        increasing: 0,
                        decreasing: 0,
                        stable: 0
                    }
                };
            }

            const categoryStats = analytics[record.category];
            const month = new Date(record.startDate).getMonth();

            categoryStats.totalSpent += record.actualSpent || 0;
            categoryStats.totalPlanned += record.originalAmount || 0;

            const utilizationRate = ((record.actualSpent || 0) / (record.originalAmount || 1)) * 100;
            categoryStats.utilization.push(utilizationRate);

            if (!categoryStats.monthlyAverages[month]) {
                categoryStats.monthlyAverages[month] = [];
            }
            categoryStats.monthlyAverages[month].push(record.actualSpent || 0);

            if (categoryStats.utilization.length > 1) {
                const diff = utilizationRate - categoryStats.utilization[categoryStats.utilization.length - 2];
                if (diff > 5) categoryStats.trends.increasing++;
                else if (diff < -5) categoryStats.trends.decreasing++;
                else categoryStats.trends.stable++;
            }

            if (record.rolloverAmount) {
                categoryStats.rollovers += record.rolloverAmount;
            }
        });

        return Object.values(analytics).map(stat => ({
            category: stat.category,
            averageUtilization: (stat.utilization.reduce((a, b) => a + b, 0) / stat.utilization.length).toFixed(2),
            totalSpent: stat.totalSpent.toFixed(2),
            totalPlanned: stat.totalPlanned.toFixed(2),
            monthlyAverageSpend: Object.values(stat.monthlyAverages)
                .map(month => month.reduce((a, b) => a + b, 0) / month.length)
                .reduce((a, b) => a + b, 0) / Object.keys(stat.monthlyAverages).length,
            spendingTrend: this.calculateTrend(stat.trends),
            totalRollovers: stat.rollovers.toFixed(2),
            consistencyScore: this.calculateConsistencyScore(stat.utilization)
        }));
    }

    calculateTrend(trends) {
        if (trends.increasing > trends.decreasing && trends.increasing > trends.stable) return 'Increasing';
        if (trends.decreasing > trends.increasing && trends.decreasing > trends.stable) return 'Decreasing';
        return 'Stable';
    }

    calculateConsistencyScore(utilization) {
        if (utilization.length < 2) return 100;
        const variations = utilization.slice(1).map((val, i) =>
            Math.abs(val - utilization[i])
        );
        const averageVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
        return Math.max(0, 100 - averageVariation).toFixed(2);
    }

    generateCSVExports(data) {
        return {
            transactions: this.objectsToCSV(data.transactions || [], [
                'date', 'amount', 'category', 'description', 'type'
            ]),
            budgets: this.objectsToCSV(data.currentBudgets || [], [
                'category', 'amount', 'spent', 'period'
            ]),
            budgetHistory: this.objectsToCSV(data.budgetHistory || [], [
                'period', 'category', 'originalAmount', 'actualSpent', 'rolloverAmount'
            ]),
            budgetAnalytics: this.objectsToCSV(data.budgetAnalytics || [], [
                'category',
                'averageUtilization',
                'totalSpent',
                'totalPlanned',
                'monthlyAverageSpend',
                'spendingTrend',
                'totalRollovers',
                'consistencyScore'
            ]),
            loans: this.objectsToCSV(data.loanData || [], [
                'type', 'amount', 'interestRate', 'remainingBalance'
            ])
        };
    }

    objectsToCSV(objects, headers) {
        if (!objects || objects.length === 0) {
            return headers.join(',') + '\n';
        }

        const csvRows = [headers.join(',')];
        for (const object of objects) {
            const row = headers.map(header => {
                const value = object[header] || '';
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(row.join(','));
        }
        return csvRows.join('\n');
    }
}

module.exports = DataExportService;