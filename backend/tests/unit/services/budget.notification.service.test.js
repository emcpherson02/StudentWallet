const BudgetNotificationService = require('../../../src/services/budget.notification.service');
const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn()
    })
}));

describe('BudgetNotificationService', () => {
    let budgetNotificationService;
    let mockUserModel;
    let mockTransporter;
    let mockDb;

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        notificationsEnabled: true
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock collection for notifications
        mockDb = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'notification-id' })
        };

        // Create mock user model
        mockUserModel = {
            findById: jest.fn().mockResolvedValue(mockUser),
            db: mockDb
        };

        // Get mock transporter from nodemailer
        mockTransporter = nodemailer.createTransport();

        // Create service instance
        budgetNotificationService = new BudgetNotificationService(mockUserModel);
    });

    describe('checkAndNotifyBudgetLimit', () => {
        const testParams = {
            userId: 'test-user-id',
            budgetCategory: 'Groceries',
            spent: 1000,
            limit: 800
        };

        it('should send notification when budget limit is exceeded', async () => {
            await budgetNotificationService.checkAndNotifyBudgetLimit(
                testParams.userId,
                testParams.budgetCategory,
                testParams.spent,
                testParams.limit
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: expect.stringContaining(testParams.budgetCategory)
                })
            );
            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(mockDb.add).toHaveBeenCalled();
        });

        it('should not send notification when budget is within limit', async () => {
            await budgetNotificationService.checkAndNotifyBudgetLimit(
                testParams.userId,
                testParams.budgetCategory,
                500, // Below limit
                testParams.limit
            );

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
            expect(mockDb.add).not.toHaveBeenCalled();
        });

        it('should not send notification when notifications are disabled', async () => {
            mockUserModel.findById.mockResolvedValueOnce({
                ...mockUser,
                notificationsEnabled: false
            });

            await budgetNotificationService.checkAndNotifyBudgetLimit(
                testParams.userId,
                testParams.budgetCategory,
                testParams.spent,
                testParams.limit
            );

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
            expect(mockDb.add).not.toHaveBeenCalled();
        });

        it('should handle user not found gracefully', async () => {
            mockUserModel.findById.mockResolvedValueOnce(null);

            await budgetNotificationService.checkAndNotifyBudgetLimit(
                testParams.userId,
                testParams.budgetCategory,
                testParams.spent,
                testParams.limit
            );

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
            expect(mockDb.add).not.toHaveBeenCalled();
        });
    });

    describe('sendBudgetRolloverEmail', () => {
        const testParams = {
            userId: 'test-user-id',
            category: 'Groceries',
            amount: 1000,
            spent: 800,
            unspentAmount: 200
        };

        it('should send rollover email and store notification', async () => {
            await budgetNotificationService.sendBudgetRolloverEmail(
                testParams.userId,
                testParams.category,
                testParams.amount,
                testParams.spent,
                testParams.unspentAmount
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: expect.stringContaining('Budget Rollover Alert')
                })
            );
            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(mockDb.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Budget Rollover Alert',
                    type: 'email'
                })
            );
        });

        it('should handle email sending failure', async () => {
            mockTransporter.sendMail.mockRejectedValueOnce(new Error('Email sending failed'));

            await expect(
                budgetNotificationService.sendBudgetRolloverEmail(
                    testParams.userId,
                    testParams.category,
                    testParams.amount,
                    testParams.spent,
                    testParams.unspentAmount
                )
            ).rejects.toThrow('Email sending failed');
        });
    });

    describe('storeNotification', () => {
        const testParams = {
            userId: 'test-user-id',
            title: 'Test Notification',
            message: 'Test Message'
        };

        it('should store notification successfully', async () => {
            await budgetNotificationService.storeNotification(
                testParams.userId,
                testParams.title,
                testParams.message
            );

            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(mockDb.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: testParams.title,
                    message: testParams.message,
                    type: 'email'
                })
            );
        });

        it('should handle storage failure gracefully', async () => {
            mockDb.add.mockRejectedValueOnce(new Error('Storage failed'));

            await budgetNotificationService.storeNotification(
                testParams.userId,
                testParams.title,
                testParams.message
            );

            // Should not throw error, just log it
            expect(mockDb.collection).toHaveBeenCalledWith('users');
        });
    });
});