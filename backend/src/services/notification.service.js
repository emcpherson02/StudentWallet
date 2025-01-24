const nodemailer = require('nodemailer');

class NotificationService {
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

    async checkAndNotifyLowBalance(userId, currentBalance) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) return;

            const thresholdAmount = user.balanceThreshold || 0;

            if (currentBalance <= thresholdAmount) {
                await this.sendLowBalanceEmail(user.email, currentBalance, thresholdAmount);
            }
        } catch (error) {
            console.error('Failed to send low balance notification:', error);
        }
    }

    async sendLowBalanceEmail(userEmail, currentBalance, threshold) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Low Balance Alert - StudentWallet',
            html: `
                <h2>Low Balance Alert</h2>
                <p>Your account balance has fallen to £${currentBalance}</p>
                <p>This is below your set threshold of £${threshold}</p>
                <p>Please check your StudentWallet account for more details.</p>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async updateBalanceThreshold(userId, threshold) {
        await this.userModel.update(userId, { balanceThreshold: threshold });
    }
}

module.exports = NotificationService;