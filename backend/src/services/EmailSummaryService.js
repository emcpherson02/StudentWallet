const nodemailer = require("nodemailer");

class EmailSummaryService {
    constructor(userModel, transactionModel, budgetService, loanModel, budgetAnalyticsService) {
        this.userModel = userModel;
        this.transactionModel = transactionModel;
        this.budgetService = budgetService;  // Changed from budgetModel
        this.loanModel = loanModel;
        this.budgetAnalyticsService = budgetAnalyticsService;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async processWeeklySummaries() {
        // Get all users with notifications enabled
        const users = await this.userModel.findAllWithNotifications();

        for (const user of users) {
            try {
                await this.generateAndSendSummary(user.id);
            } catch (error) {
                console.error(`Failed to process summary for user ${user.id}:`, error);
                // Log error but continue with next user
            }
        }
    }

    async generateAndSendSummary(userId) {
        // Calculate date range for past week
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Generate summary data
        const summaryData = await this.generateWeeklySummary(
            userId,
            startDate.toISOString(),
            endDate.toISOString()
        );

        // Format email content
        const emailContent = this.formatEmailContent(summaryData);

        // Send email
        await this.sendSummaryEmail(userId, emailContent);

        // Log email sent in notification history
        await this.storeNotification(
            userId,
            'Weekly Summary Email',
            'Your weekly financial summary has been sent to your email'
        );
    }

    async storeNotification(userId, title, message) {
        try {
            console.log('Storing notification for user:', userId);
            const userRef = this.db.collection('users').doc(userId);
            const result = await userRef.collection('notifications').add({
                title,
                message,
                timestamp: new Date().toISOString(),
                type: 'email'
            });
            console.log('Notification stored successfully:', result.id);
        } catch (error) {
            console.error('Error storing notification:', error);
            console.error('Error details:', {userId, title, message});
        }
    }


    async generateWeeklySummary(userId, startDate, endDate) {
        console.log('===== BEGIN EMAIL SUMMARY DEBUG =====');
        console.log(`Generating summary for user ${userId} from ${startDate} to ${endDate}`);

        // Fetch user data
        const user = await this.userModel.findById(userId);
        console.log('User data:', JSON.stringify(user, null, 2));

        // Fetch transactions for the date range
        const transactions = await this.transactionModel.findByUserId(userId);
        console.log('All transactions:', JSON.stringify(transactions, null, 2));

        const weeklyTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const result = txDate >= new Date(startDate) && txDate <= new Date(endDate);
            return result;
        });
        console.log(`Filtered weekly transactions (${weeklyTransactions.length}):`, JSON.stringify(weeklyTransactions, null, 2));

        // Get budget summary
        console.log('About to fetch budget summary');
        const budgetSummary = await this.budgetService.getBudgetSummary(userId);
        console.log('Budget summary:', JSON.stringify(budgetSummary, null, 2));

        // Get loan information
        console.log('About to fetch loan information');
        const loanInfo = await this.loanModel.findByUserId(userId);
        console.log('Loan information:', JSON.stringify(loanInfo, null, 2));

        // Calculate key metrics
        const totalSpent = weeklyTransactions.reduce((sum, tx) =>
            sum + Math.abs(tx.Amount || 0), 0);
        console.log('Total spent this week:', totalSpent);

        // Group transactions by day
        const dailySpending = this.calculateDailySpending(weeklyTransactions);
        console.log('Daily spending breakdown:', JSON.stringify(dailySpending, null, 2));

        // Group transactions by category
        const categoryBreakdown = this.calculateCategoryBreakdown(weeklyTransactions);
        console.log('Category breakdown:', JSON.stringify(categoryBreakdown, null, 2));

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            weeklyTransactions,
            budgetSummary,
            loanInfo.length > 0 ? loanInfo[0] : null
        );
        console.log('Recommendations:', JSON.stringify(recommendations, null, 2));

        const summaryData = {
            user,
            dateRange: { startDate, endDate },
            totalSpent,
            weeklyTransactions,
            dailySpending,
            categoryBreakdown,
            budgetSummary,
            loan: loanInfo.length > 0 ? loanInfo[0] : null,
            recommendations
        };

        console.log('Final summary data structure:', Object.keys(summaryData));
        console.log('===== END EMAIL SUMMARY DEBUG =====');

        return summaryData;
    }

    calculateDailySpending(transactions) {
        const dailyTotals = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Initialize all days with zero
        days.forEach(day => {
            dailyTotals[day] = 0;
        });

        // Sum transactions by day
        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const day = days[date.getDay()];
            dailyTotals[day] += Math.abs(tx.Amount || 0);
        });

        return Object.entries(dailyTotals).map(([day, total]) => ({ day, total }));
    }

    calculateCategoryBreakdown(transactions) {
        const categories = {};

        transactions.forEach(tx => {
            const category = tx.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += Math.abs(tx.Amount || 0);
        });

        return Object.entries(categories).map(([category, amount]) => ({
            category,
            amount,
            percentage: 0 // Will be calculated later
        }));
    }

    identifyLargestTransactions(transactions) {
        return [...transactions]
            .sort((a, b) => Math.abs(b.Amount || 0) - Math.abs(a.Amount || 0))
            .slice(0, 5);
    }

    generateRecommendations(transactions, budgetSummary, loan, analytics) {
        const recommendations = [];

        // Check for categories approaching budget limits
        budgetSummary.categoryBreakdown.forEach(category => {
            if (category.percentageUsed > 80 && category.percentageUsed < 100) {
                recommendations.push({
                    type: 'warning',
                    message: `Your ${category.category} budget is at ${category.percentageUsed}%. Consider limiting spending in this category.`
                });
            }
        });

        // Check for categories that have exceeded budgets
        budgetSummary.categoryBreakdown.forEach(category => {
            if (category.percentageUsed > 100) {
                recommendations.push({
                    type: 'alert',
                    message: `Your ${category.category} budget has been exceeded by ${(category.percentageUsed - 100).toFixed(1)}%.`
                });
            }
        });

        // Add loan-related recommendations
        if (loan) {
            // Calculate days until next installment
            const nextInstallment = loan.instalmentDates
                .map((date, index) => ({ date, amount: loan.instalmentAmounts[index] }))
                .find(inst => new Date(inst.date) > new Date());

            if (nextInstallment) {
                const daysUntil = Math.ceil((new Date(nextInstallment.date) - new Date()) / (1000 * 60 * 60 * 24));

                if (daysUntil <= 7) {
                    recommendations.push({
                        type: 'info',
                        message: `Your next loan installment of £${nextInstallment.amount.toFixed(2)} is due in ${daysUntil} days.`
                    });
                }
            }
        }

        // Add at least one general savings tip
        const savingsTips = [
            "Consider meal prepping to reduce food delivery expenses.",
            "Look for student discounts on your regular purchases.",
            "Try setting aside a small amount each week for unexpected expenses.",
            "Check if you're eligible for any utility or transport discounts.",
            "Consider using the library for textbooks instead of buying them."
        ];

        recommendations.push({
            type: 'tip',
            message: savingsTips[Math.floor(Math.random() * savingsTips.length)]
        });

        return recommendations;
    }

    formatEmailContent(summaryData) {
        // Extract the user's name or use a default
        const userName = summaryData.user?.displayName || 'there';

        // Format date ranges for display
        const startDate = new Date(summaryData.dateRange.startDate);
        const endDate = new Date(summaryData.dateRange.endDate);
        const dateRangeText = `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

        // Build budget section
        let budgetsHtml = '<h2>Budget Status</h2>';
        if (summaryData.budgetSummary && summaryData.budgetSummary.categoryBreakdown) {
            budgetsHtml += '<div class="budgets-container">';

            summaryData.budgetSummary.categoryBreakdown.forEach(budget => {
                const percentUsed = parseFloat(budget.percentageUsed);
                let progressClass = 'progress-normal';

                if (percentUsed > 85) progressClass = 'progress-danger';
                else if (percentUsed > 70) progressClass = 'progress-warning';

                budgetsHtml += `
                <div class="budget-item">
                    <h3>${budget.category}</h3>
                    <div class="budget-details">
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentUsed, 100)}%"></div>
                            </div>
                            <div class="progress-text">${percentUsed}% Used</div>
                        </div>
                        <div class="budget-amounts">
                            <div class="amount-row">
                                <span>Budget:</span>
                                <span>£${budget.budgetAmount.toFixed(2)}</span>
                            </div>
                            <div class="amount-row">
                                <span>Spent:</span>
                                <span>£${budget.spent.toFixed(2)}</span>
                            </div>
                            <div class="amount-row amount-remaining">
                                <span>Remaining:</span>
                                <span>£${budget.remaining.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            });

            budgetsHtml += '</div>';
        } else {
            budgetsHtml += '<p>No active budgets for this period.</p>';
        }

        // Build transactions section
        let transactionsHtml = '<h2>Recent Transactions</h2>';

        if (summaryData.weeklyTransactions && summaryData.weeklyTransactions.length > 0) {
            transactionsHtml += '<div class="transactions-list">';

            summaryData.weeklyTransactions.forEach(transaction => {
                const txDate = new Date(transaction.date).toLocaleDateString();
                transactionsHtml += `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">${transaction.Description}</div>
                        <div class="transaction-date">${txDate}</div>
                    </div>
                    <div class="transaction-category">${transaction.category || 'Uncategorized'}</div>
                    <div class="transaction-amount">£${Math.abs(transaction.Amount).toFixed(2)}</div>
                </div>
            `;
            });

            transactionsHtml += '</div>';
        } else {
            transactionsHtml += '<p>No transactions recorded for this period.</p>';
        }

        // Build recommendations section
        let recommendationsHtml = '<h2>Personalized Recommendations</h2>';

        if (summaryData.recommendations && summaryData.recommendations.length > 0) {
            recommendationsHtml += '<div class="recommendations-list">';

            summaryData.recommendations.forEach(rec => {
                let iconClass = 'tip-icon';
                let titleText = 'Tip';

                if (rec.type === 'warning') {
                    iconClass = 'warning-icon';
                    titleText = 'Warning';
                } else if (rec.type === 'alert') {
                    iconClass = 'alert-icon';
                    titleText = 'Alert';
                }

                recommendationsHtml += `
                <div class="recommendation-item ${rec.type}">
                    <div class="${iconClass}"></div>
                    <div class="recommendation-content">
                        <div class="recommendation-title">${titleText}</div>
                        <div class="recommendation-message">${rec.message}</div>
                    </div>
                </div>
            `;
            });

            recommendationsHtml += '</div>';
        } else {
            recommendationsHtml += `
            <div class="recommendation-item tip">
                <div class="tip-icon"></div>
                <div class="recommendation-content">
                    <div class="recommendation-title">Tip</div>
                    <div class="recommendation-message">
                        Try setting up more detailed budgets to track your spending patterns better.
                    </div>
                </div>
            </div>
        `;
        }

        // Complete email template
        return {
            subject: `Your Weekly Financial Summary - ${new Date().toLocaleDateString()}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Financial Summary</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }
                
                body {
                    background-color: #f5f5f5;
                    color: #333;
                    line-height: 1.6;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                
                .email-header {
                    background-color: #1a73e8;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                
                .email-header h1 {
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                
                .email-content {
                    padding: 20px;
                }
                
                .summary-box {
                    background-color: #f1f8ff;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 25px;
                    text-align: center;
                }
                
                .summary-box h2 {
                    font-size: 18px;
                    margin-bottom: 10px;
                    color: #1a73e8;
                }
                
                .total-amount {
                    font-size: 28px;
                    font-weight: bold;
                    color: #1a73e8;
                }
                
                h2 {
                    font-size: 20px;
                    color: #1a73e8;
                    margin: 25px 0 15px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .budget-item {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .budget-item h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .budget-details {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .progress-container {
                    margin-bottom: 5px;
                }
                
                .progress-bar {
                    height: 10px;
                    background-color: #e0e0e0;
                    border-radius: 5px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }
                
                .progress-fill {
                    height: 100%;
                    border-radius: 5px;
                }
                
                .progress-normal {
                    background-color: #34a853;
                }
                
                .progress-warning {
                    background-color: #fbbc04;
                }
                
                .progress-danger {
                    background-color: #ea4335;
                }
                
                .progress-text {
                    font-size: 14px;
                    color: #5f6368;
                }
                
                .budget-amounts {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .amount-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                }
                
                .amount-remaining {
                    font-weight: bold;
                    color: #34a853;
                }
                
                .transactions-list, .recommendations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .transaction-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                }
                
                .transaction-info {
                    flex: 2;
                }
                
                .transaction-name {
                    font-weight: bold;
                }
                
                .transaction-date {
                    font-size: 12px;
                    color: #5f6368;
                }
                
                .transaction-category {
                    flex: 1;
                    font-size: 14px;
                    color: #5f6368;
                    text-align: center;
                }
                
                .transaction-amount {
                    flex: 1;
                    font-weight: bold;
                    text-align: right;
                }
                
                .recommendation-item {
                    display: flex;
                    gap: 15px;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                }
                
                .tip {
                    background-color: #e8f0fe;
                }
                
                .warning {
                    background-color: #fef7e0;
                }
                
                .alert {
                    background-color: #fce8e6;
                }
                
                .recommendation-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .tip-icon:before {
                    content: "💡";
                    font-size: 20px;
                }
                
                .warning-icon:before {
                    content: "⚠️";
                    font-size: 20px;
                }
                
                .alert-icon:before {
                    content: "🚨";
                    font-size: 20px;
                }
                
                .email-footer {
                    background-color: #f8f9fa;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #5f6368;
                    border-top: 1px solid #e0e0e0;
                }
                
                .app-button {
                    display: block;
                    background-color: #1a73e8;
                    color: white;
                    text-decoration: none;
                    text-align: center;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 20px auto;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>StudentWallet</h1>
                    <p>Weekly Financial Summary</p>
                </div>
                
                <div class="email-content">
                    <h1>Hello ${userName}!</h1>
                    <p>Here's your weekly financial summary for ${dateRangeText}.</p>
                    
                    <div class="summary-box">
                        <h2>Total Spent This Week</h2>
                        <div class="total-amount">£${summaryData.totalSpent.toFixed(2)}</div>
                    </div>
                    
                    ${budgetsHtml}
                    
                    ${transactionsHtml}
                    
                    ${recommendationsHtml}
                    
                    <a href="#" class="app-button">Open StudentWallet App</a>
                </div>
                
                <div class="email-footer">
                    <p>This is an automated email from StudentWallet. Please do not reply.</p>
                    <p>&copy; 2025 StudentWallet. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
        };
    }

    async sendSummaryEmail(userId, emailContent) {
        const user = await this.userModel.findById(userId);
        if (!user || !user.email) {
            throw new Error('User email not found');
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html
        };

        try {
            // Send email using the notification service's transporter
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Weekly summary email sent:', result);
            return result;
        } catch (error) {
            console.error('Failed to send weekly summary email:', error);
            throw error;
        }
    }
}

module.exports = EmailSummaryService;