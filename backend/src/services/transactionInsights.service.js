class TransactionInsightsService {
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }

    async generateInsights(userId) {
        const transactions = await this.transactionModel.findByUserId(userId);

        const insights = {
            spendingPatterns: this.analyzeSpendingPatterns(transactions),
            unusualTransactions: this.detectUnusualTransactions(transactions),
            recommendations: this.generateRecommendations(transactions)
        };

        return insights;
    }

    analyzeSpendingPatterns(transactions) {
        const categoryTotals = {};
        const monthlySpending = {};

        transactions.forEach(transaction => {
            const amount = Math.abs(transaction.Amount);
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Category analysis
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;

            // Monthly spending
            monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + amount;
        });

        // Find top spending categories
        const topCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        // Calculate month-over-month change
        const sortedMonths = Object.keys(monthlySpending).sort();
        const monthlyTrend = sortedMonths.length > 1 ?
            ((monthlySpending[sortedMonths[sortedMonths.length - 1]] /
                monthlySpending[sortedMonths[sortedMonths.length - 2]]) - 1) * 100 : 0;

        return {
            topCategories,
            monthlyTrend: parseFloat(monthlyTrend.toFixed(1))
        };
    }

    detectUnusualTransactions(transactions) {
        if (transactions.length < 2) return [];

        // Calculate mean and standard deviation of transaction amounts
        const amounts = transactions.map(t => Math.abs(t.Amount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
            amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length
        );

        // Find transactions > 2 standard deviations from mean
        return transactions
            .filter(t => Math.abs(t.Amount) > mean + (2 * stdDev))
            .map(t => ({
                id: t.id,
                amount: t.Amount,
                description: t.Description,
                date: t.date,
                category: t.category
            }));
    }

    generateRecommendations(transactions) {
        const recommendations = [];
        const categoryTotals = {};
        let totalSpent = 0;

        transactions.forEach(transaction => {
            const amount = Math.abs(transaction.Amount);
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
            totalSpent += amount;
        });

        // Analyze spending distribution
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            const percentage = (amount / totalSpent) * 100;

            if (category === 'Entertainment' && percentage > 20) {
                recommendations.push({
                    type: 'warning',
                    message: 'Entertainment spending is higher than recommended. Consider setting a budget for leisure activities.'
                });
            }
            if (category === 'Groceries' && percentage > 30) {
                recommendations.push({
                    type: 'suggestion',
                    message: 'High grocery spending detected. Try meal planning and bulk buying to reduce costs.'
                });
            }
        });

        // Analyze transaction frequency
        const daysWithTransactions = new Set(
            transactions.map(t => new Date(t.date).toISOString().split('T')[0])
        ).size;

        if (daysWithTransactions > 20) {
            recommendations.push({
                type: 'suggestion',
                message: 'You have frequent transactions. Consider consolidating purchases to reduce impulse spending.'
            });
        }

        // Check for late night spending
        const lateNightTransactions = transactions.filter(t => {
            const hour = new Date(t.date).getHours();
            return hour >= 23 || hour <= 4;
        }).length;
        if (lateNightTransactions > 3) {
            recommendations.push({
                type: 'warning',
                message: 'Multiple late-night transactions detected. Consider setting spending curfews to avoid impulse purchases.'
            });
        }

        // Analyse weekend vs weekday spending
        const weekendSpending = transactions.reduce((sum, t) => {
            const day = new Date(t.date).getDay();
            return sum + (day === 0 || day === 6 ? Math.abs(t.Amount) : 0);
        }, 0);
        if (weekendSpending > totalSpent * 0.4) {
            recommendations.push({
                type: 'suggestion',
                message: 'Your weekend spending is quite high. Try planning weekend activities in advance to better control costs.'
            });
        }

        // Check for frequent small transactions
        const smallTransactions = transactions.filter(t => Math.abs(t.Amount) < 5).length;
        if (smallTransactions > transactions.length * 0.2) {
            recommendations.push({
                type: 'suggestion',
                message: 'Many small transactions detected. Consider consolidating purchases to reduce bank charges and track spending better.'
            });
        }

        // Analyse transport spending
        if (categoryTotals['Transportation'] > totalSpent * 0.15) {
            recommendations.push({
                type: 'suggestion',
                message: 'High transport costs detected. Consider walking, cycling, or using a student travel card to reduce expenses.'
            });
        }

        // Check for shopping patterns
        const shoppingTransactions = transactions.filter(t =>
            t.category === 'Shopping' && Math.abs(t.Amount) > 50
        ).length;
        if (shoppingTransactions > 3) {
            recommendations.push({
                type: 'warning',
                message: 'Multiple large shopping transactions found. Try implementing a 24-hour rule before major purchases.'
            });
        }

        // Dining out frequency
        const diningTransactions = transactions.filter(t => t.category === 'Dining Out').length;
        if (diningTransactions > 8) {
            recommendations.push({
                type: 'suggestion',
                message: 'Frequent dining out detected. Consider meal prepping to reduce food expenses.'
            });
        }

        // Book store purchases for students
        const bookstoreSpending = transactions.filter(t =>
            t.Description?.toLowerCase().includes('book') ||
            t.Description?.toLowerCase().includes('textbook')
        ).reduce((sum, t) => sum + Math.abs(t.Amount), 0);
        if (bookstoreSpending > 100) {
            recommendations.push({
                type: 'suggestion',
                message: 'High textbook expenses noted. Check your university library or consider second-hand books and digital alternatives.'
            });
        }

        // Analyse utility spending
        if (categoryTotals['Utilities'] > totalSpent * 0.2) {
            recommendations.push({
                type: 'suggestion',
                message: "High utility costs detected. Consider energy-saving measures and check if you're eligible for student utility discounts."
            });
        }

        return recommendations;
    }
}

module.exports = TransactionInsightsService;