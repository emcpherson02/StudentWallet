const nodemailer = require('nodemailer');
const cron = require('node-cron');
const {admin} = require("../config/firebase.config");

class LoanNotificationService {
    constructor(userModel) {
        this.userModel = userModel;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Initialize daily instalment check
        this.initializeDailyCheck();
    }

    initializeDailyCheck() {
        // Run at 9 AM every day
        cron.schedule('0 9 * * *', async () => {
            try {
                console.log('Running daily instalment check...');
                const users = await this.userModel.findAllWithNotifications();
                console.log('Found users with notifications:', users);
                for (const user of users) {
                    await this.checkUpcomingInstalments(user.id);
                }
            } catch (error) {
                console.error('Error in daily instalment check:', error);
            }
        });

        // Run immediately for testing
        this.immediateCheck();
    }

    async immediateCheck() {
        try {
            console.log('Running immediate instalment check...');
            const users = await this.userModel.findAllWithNotifications();
            console.log('Found users with notifications:', users);
            for (const user of users) {
                await this.checkUpcomingInstalments(user.id);
            }
        } catch (error) {
            console.error('Error in immediate instalment check:', error);
        }
    }

    async checkSpendingThreshold(userId, availableAmount) {
        try {
            console.log('Checking spending threshold for user:', userId);
            const user = await this.userModel.findById(userId);
            console.log('User notifications enabled:', user?.notificationsEnabled);

            if (!user || !user.notificationsEnabled) {
                console.log('Notifications not enabled for user:', userId);
                return;
            }

            // Get current loan data to calculate actual spent amount
            const loanSnapshot = await this.userModel.db
                .collection('users')
                .doc(userId)
                .collection('MaintenanceLoan')
                .limit(1)
                .get();

            if (loanSnapshot.empty) {
                console.log('No loan found for user');
                return;
            }

            const loan = loanSnapshot.docs[0].data();

            // Fetch transaction details for tracked transactions
            const transactions = [];
            if (loan.trackedTransactions && loan.trackedTransactions.length > 0) {
                const transactionsSnapshot = await this.userModel.db
                    .collection('users')
                    .doc(userId)
                    .collection('Transactions')
                    .where(admin.firestore.FieldPath.documentId(), 'in', loan.trackedTransactions)
                    .get();

                transactions.push(...transactionsSnapshot.docs.map(doc => doc.data()));
            }

            if (transactions.length === 0) {
                console.log('No transactions found');
                return;
            }

            const currentSpent = transactions.reduce((total, transaction) =>
                total + Math.abs(transaction.Amount), 0);
            console.log('Current spent amount:', currentSpent);
            console.log('Available amount:', availableAmount);

            const spendingPercentage = (currentSpent / availableAmount) * 100;
            console.log('Spending percentage:', spendingPercentage);

            if (spendingPercentage >= 80) {
                await this.sendSpendingAlert(user.email, {
                    spentAmount: currentSpent,
                    availableAmount,
                    percentage: spendingPercentage
                });
            }
        } catch (error) {
            console.error('Error checking spending threshold:', error);
        }
    }

    async checkUpcomingInstalments(userId) {
        try {
            console.log('Checking upcoming instalments for user:', userId);
            const user = await this.userModel.findById(userId);
            if (!user?.notificationsEnabled) {
                console.log('Notifications not enabled for user:', userId);
                return;
            }

            const loanSnapshot = await this.userModel.db
                .collection('users')
                .doc(userId)
                .collection('MaintenanceLoan')
                .limit(1)
                .get();

            if (loanSnapshot.empty) {
                console.log('No loan found for user');
                return;
            }

            const loan = loanSnapshot.docs[0].data();
            const nextInstalment = this.findNextInstalment(loan);

            if (nextInstalment) {
                const daysUntil = this.calculateDaysUntil(nextInstalment.date);
                console.log('Days until next instalment:', daysUntil);

                if (daysUntil <= 3 && daysUntil > 0) {
                    console.log('Sending instalment reminder');
                    await this.sendInstalmentReminder(user.email, nextInstalment);
                }
            }
        } catch (error) {
            console.error('Error checking upcoming instalments:', error);
        }
    }

    findNextInstalment(loan) {
        const currentDate = new Date();
        for (let i = 0; i < loan.instalmentDates.length; i++) {
            const instalmentDate = new Date(loan.instalmentDates[i]);
            if (instalmentDate > currentDate) {
                return {
                    date: instalmentDate,
                    amount: loan.instalmentAmounts[i]
                };
            }
        }
        return null;
    }

    calculateDaysUntil(date) {
        const difference = new Date(date) - new Date();
        return Math.ceil(difference / (1000 * 60 * 60 * 24));
    }

    async sendSpendingAlert(userEmail, data) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Student Wallet - Loan Spending Alert',
            html: `
                <h2>Loan Spending Alert</h2>
                <p>You have spent ${data.percentage.toFixed(1)}% of your available loan amount.</p>
                <ul>
                    <li>Amount Spent: £${data.spentAmount.toFixed(2)}</li>
                    <li>Available Amount: £${data.availableAmount.toFixed(2)}</li>
                </ul>
                <p>Please check your StudentWallet account to review your spending.</p>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Spending alert email sent:', result);
            return result;
        } catch (error) {
            console.error('Failed to send spending alert email:', error);
            throw error;
        }
    }

    async sendInstalmentReminder(userEmail, instalment) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Student Wallet - Upcoming Loan Instalment',
            html: `
                <h2>Upcoming Loan Instalment</h2>
                <p>Your next loan instalment is due in ${this.calculateDaysUntil(instalment.date)} days.</p>
                <ul>
                    <li>Amount: £${instalment.amount.toFixed(2)}</li>
                    <li>Date: ${new Date(instalment.date).toLocaleDateString()}</li>
                </ul>
                <p>The amount will be automatically credited to your account on the specified date.</p>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Instalment reminder email sent:', result);
            return result;
        } catch (error) {
            console.error('Failed to send instalment reminder email:', error);
            throw error;
        }
    }
}

module.exports = LoanNotificationService;