const { admin } = require('../config/firebase.config');

class DataExportService {
    constructor(userModel, transactionModel, budgetModel, loanModel, budgetHistoryModel) {
        this.userModel = userModel;
        this.transactionModel = transactionModel;
        this.budgetModel = budgetModel;
        this.loanModel = loanModel;
        this.budgetHistoryModel = budgetHistoryModel;
    }

    async generateExport(userId) {
        try {
            const [
                userData,
                transactions,
                budgets,
                loanData,
                budgetHistory,
                categories,
                notifications
            ] = await Promise.all([
                this.userModel.findById(userId),
                this.transactionModel.findByUserId(userId),
                this.budgetModel.findByUserId(userId),
                this.loanModel.findByUserId(userId),
                this.getBudgetHistory(userId),
                this.userModel.getCategories(userId),
                this.getNotificationHistory(userId)
            ]);

            const exportData = {
                exportDate: new Date().toISOString(),
                userProfile: this.sanitizeUserData(userData),
                transactions: this.formatTransactions(transactions),
                budgets: this.formatBudgets(budgets),
                loanInformation: loanData,
                budgetHistory,
                customCategories: categories,
                notificationSettings: {
                    enabled: userData.notificationsEnabled,
                    history: notifications
                }
            };

            return {
                json: exportData,
                csv: this.generateCSVExports(exportData)
            };
        } catch (error) {
            console.error('Error generating data export:', error);
            throw new Error('Failed to generate data export');
        }
    }

    sanitizeUserData(userData) {
        const { password, ...safeData } = userData;
        return safeData;
    }

    formatTransactions(transactions) {
        return transactions.map(tx => ({
            date: tx.date,
            amount: tx.Amount,
            category: tx.category,
            description: tx.Description,
            type: tx.type,
            isPlaidTransaction: tx.isPlaidTransaction || false
        }));
    }

    formatBudgets(budgets) {
        return budgets.map(budget => ({
            category: budget.category,
            amount: budget.amount,
            spent: budget.spent,
            period: budget.period,
            startDate: budget.startDate,
            endDate: budget.endDate
        }));
    }

    async getBudgetHistory(userId) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        const endDate = new Date().toISOString().split('T')[0];

        return await this.budgetHistoryModel.findByPeriod(
            userId,
            startDate.toISOString().split('T')[0],
            endDate
        );
    }

    async getNotificationHistory(userId) {
        const userRef = this.userModel.db.collection('users').doc(userId);
        const snapshot = await userRef
            .collection('notifications')
            .orderBy('timestamp', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    generateCSVExports(data) {
        return {
            transactions: this.objectsToCSV(data.transactions, [
                'date', 'amount', 'category', 'description', 'type'
            ]),
            budgets: this.objectsToCSV(data.budgets, [
                'category', 'amount', 'spent', 'period', 'startDate', 'endDate'
            ])
        };
    }

    objectsToCSV(objects, headers) {
        if (!objects.length) return '';

        const csvRows = [headers.join(',')];

        for (const object of objects) {
            const row = headers.map(header => {
                const value = object[header] || '';
                return typeof value === 'string'
                    ? `"${value.replace(/"/g, '""')}"`
                    : value;
            });
            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
    }
}

module.exports = DataExportService;