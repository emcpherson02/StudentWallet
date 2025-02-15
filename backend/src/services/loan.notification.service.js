const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { admin } = require('../config/firebase.config');

class LoanNotificationService {
    constructor(userModel) {
        this.userModel = userModel;
        this.db = userModel.db;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        this.initializeDailyCheck();
    }

    initializeDailyCheck() {
        // Run at 9 AM every day
        cron.schedule('31 23 * * *', async () => {
            try {
                console.log('Running daily instalment check...');
                const users = await this.userModel.findAllWithNotifications();
                console.log('Found users with notifications:', users);
                for (const user of users) {
                    await this.checkUpcomingInstalments(user.id);
                    await this.checkSpendingThreshold(user.id);
                }
            } catch (error) {
                console.error('Error in daily instalment check:', error);
            }
        });

        // Run immediately for testing
        // this.immediateCheck(); // REMOVE FOR PRODUCTION
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

    async checkSpendingThreshold(userId) {
        try {
            console.log('Checking spending threshold for user:', userId);
            const user = await this.userModel.findById(userId);
            console.log('User notifications enabled:', user?.notificationsEnabled);

            if (!user || !user.notificationsEnabled) {
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

            // Get the total available amount up to the current date
            const currentDate = new Date();
            let totalAvailable = 0;
            loan.instalmentDates.forEach((date, index) => {
                const instalmentDate = new Date(date);
                if (currentDate >= instalmentDate) {
                    totalAvailable += loan.instalmentAmounts[index];
                }
            });

            // Calculate current spending
            const transactions = loan.trackedTransactions || [];
            if (transactions.length === 0) {
                console.log('No transactions found');
                return;
            }

            const currentSpent = await this.calculateTotalSpent(userId, transactions);
            console.log('Current spent amount:', currentSpent);
            console.log('Total available amount:', totalAvailable);

            const spendingPercentage = (currentSpent / totalAvailable) * 100;
            console.log('Spending percentage:', spendingPercentage);

            if (spendingPercentage >= 80) {
                await this.sendSpendingAlert(userId, user.email, {
                    spentAmount: currentSpent,
                    availableAmount: totalAvailable,
                    percentage: spendingPercentage
                });
            }
        } catch (error) {
            console.error('Error checking spending threshold:', error);
        }
    }

    async calculateTotalSpent(userId, transactionIds) {
        try {
            const transactionsSnapshot = await this.userModel.db
                .collection('users')
                .doc(userId)
                .collection('Transactions')
                .where(admin.firestore.FieldPath.documentId(), 'in', transactionIds)
                .get();

            return transactionsSnapshot.docs.reduce((total, doc) => {
                const transaction = doc.data();
                return total + Math.abs(transaction.Amount || 0);
            }, 0);
        } catch (error) {
            console.error('Error calculating total spent:', error);
            return 0;
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
                    await this.sendInstalmentReminder(userId, user.email, nextInstalment);
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

    async sendSpendingAlert(userId, userEmail, data) {
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
            await this.storeNotification(
                userId,  // Use the userId that was passed in
                'Loan Spending Alert',
                `You have spent ${data.percentage.toFixed(1)}% of your available loan amount.`
            );
            return result;
        } catch (error) {
            console.error('Failed to send spending alert email:', error);
            throw error;
        }
    }

    async sendInstalmentReminder(userId, userEmail, instalment) {
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
            await this.storeNotification(
                userId,  // Use the userId that was passed in
                'Loan Instalment Reminder',
                `Your next loan instalment is due in ${this.calculateDaysUntil(instalment.date)} days.`
            );
            return result;
        } catch (error) {
            console.error('Failed to send instalment reminder email:', error);
            throw error;
        }
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
}

module.exports = LoanNotificationService;