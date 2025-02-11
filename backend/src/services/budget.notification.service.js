const nodemailer = require('nodemailer');

class BudgetNotificationService {
    constructor(userModel) {
        this.userModel = userModel;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async checkAndNotifyBudgetLimit(userId, budgetCategory, spent, limit) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                console.log('User not found:', userId);
                return;
            }

            console.log(`Notifications ${user.notificationsEnabled ? 'enabled' : 'disabled'} for user:`, userId);

            if (!user.notificationsEnabled) {
                return;
            }

            if (spent >= limit) {
                console.log('Budget limit exceeded, sending email to:', user.email);
                await this.sendBudgetLimitEmail(user.email, budgetCategory, spent, limit);
                console.log('Email sent successfully');
            } else {
                console.log('Budget within limits:', { spent, limit });
            }
        } catch (error) {
            console.error('Failed to send budget limit notification:', error);
        }
    }

    async sendBudgetLimitEmail(userEmail, category, spent, limit) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Budget Limit Alert - ${category} - StudentWallet`,
            html: `
                <h2>Budget Limit Alert</h2>
                <p>Your ${category} budget has reached its limit.</p>
                <p>Current spending: £${spent}</p>
                <p>Budget limit: £${limit}</p>
                <p>Please check your StudentWallet account to review your spending.</p>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', result);
            return result;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }
}

module.exports = BudgetNotificationService;