// Set up environment variables
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASSWORD = 'test-password';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('node-cron');
jest.mock('../../../src/config/firebase.config', () => ({
    admin: {
        firestore: {
            FieldPath: {
                documentId: jest.fn().mockReturnValue('documentId')
            }
        }
    }
}));

const LoanNotificationService = require('../../../src/services/loan.notification.service');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

describe('LoanNotificationService', () => {
    let service;
    let mockUserModel;
    let mockDb;
    let mockTransporter;

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        notificationsEnabled: true
    };

    const mockLoan = {
        instalmentDates: ['2024-01-01', '2024-04-01', '2024-07-01'],
        instalmentAmounts: [3000, 3000, 3000],
        trackedTransactions: ['transaction-1', 'transaction-2']
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        mockDb = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn(),
            add: jest.fn().mockResolvedValue({ id: 'notification-id' }),
            where: jest.fn().mockReturnThis()
        };

        mockUserModel = {
            findById: jest.fn().mockResolvedValue(mockUser),
            findAllWithNotifications: jest.fn().mockResolvedValue([mockUser]),
            db: mockDb
        };

        service = new LoanNotificationService(mockUserModel);
    });

    describe('initializeDailyCheck', () => {
        it('should schedule daily checks', () => {
            expect(cron.schedule).toHaveBeenCalledWith('0 9 * * *', expect.any(Function));
        });
    });

    describe('immediateCheck', () => {
        it('should process check for all users', async () => {
            const mockUsers = [
                { id: 'user-1', notificationsEnabled: true },
                { id: 'user-2', notificationsEnabled: true }
            ];
            mockUserModel.findAllWithNotifications.mockResolvedValue(mockUsers);
            mockDb.get.mockResolvedValue({ empty: false, docs: [{ data: () => mockLoan }] });

            await service.immediateCheck();

            expect(mockUserModel.findAllWithNotifications).toHaveBeenCalled();
            mockUsers.forEach(user => {
                expect(mockUserModel.findById).toHaveBeenCalledWith(user.id);
            });
        });

        it('should handle database errors', async () => {
            mockUserModel.findAllWithNotifications.mockRejectedValue(new Error('Test error'));

            await service.immediateCheck();

            expect(mockUserModel.findAllWithNotifications).toHaveBeenCalled();
        });
    });

    describe('checkSpendingThreshold', () => {
        const mockDate = new Date('2024-02-01');

        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(mockDate);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should send alert when spending exceeds threshold', async () => {
            mockDb.get.mockResolvedValueOnce({
                empty: false,
                docs: [{ data: () => mockLoan }]
            });

            mockDb.get.mockResolvedValueOnce({
                docs: [
                    { data: () => ({ Amount: 2000 }) },
                    { data: () => ({ Amount: 500 }) }
                ]
            });

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: 'Student Wallet - Loan Spending Alert',
                    html: expect.stringContaining('83.3')
                })
            );
        });

        it('should not send alert for spending below threshold', async () => {
            mockDb.get.mockResolvedValueOnce({
                empty: false,
                docs: [{ data: () => mockLoan }]
            });

            mockDb.get.mockResolvedValueOnce({
                docs: [{ data: () => ({ Amount: 500 }) }]
            });

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle disabled notifications', async () => {
            mockUserModel.findById.mockResolvedValueOnce({
                ...mockUser,
                notificationsEnabled: false
            });

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle missing user', async () => {
            mockUserModel.findById.mockResolvedValueOnce(null);

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle missing loan', async () => {
            mockDb.get.mockResolvedValueOnce({ empty: true });

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            mockDb.get.mockRejectedValueOnce(new Error('Test error'));

            await service.checkSpendingThreshold(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });
    });

    describe('checkUpcomingInstalments', () => {
        const mockDate = new Date('2024-03-30');

        beforeEach(() => {
            jest.useFakeTimers().setSystemTime(mockDate);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should send reminder for upcoming instalment', async () => {
            mockDb.get.mockResolvedValue({
                empty: false,
                docs: [{ data: () => mockLoan }]
            });

            await service.checkUpcomingInstalments(mockUser.id);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Student Wallet - Upcoming Loan Instalment'
                })
            );
        });

        it('should not send reminder for distant instalment', async () => {
            jest.setSystemTime(new Date('2024-03-20'));

            mockDb.get.mockResolvedValue({
                empty: false,
                docs: [{ data: () => mockLoan }]
            });

            await service.checkUpcomingInstalments(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });

        it('should handle database errors', async () => {
            mockDb.get.mockRejectedValue(new Error('Test error'));

            await service.checkUpcomingInstalments(mockUser.id);

            expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });
    });

    describe('sendSpendingAlert', () => {
        const alertData = {
            spentAmount: 2400,
            availableAmount: 3000,
            percentage: 80
        };

        it('should send alert and store notification', async () => {
            await service.sendSpendingAlert(mockUser.id, mockUser.email, alertData);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    subject: 'Student Wallet - Loan Spending Alert'
                })
            );

            expect(mockDb.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Loan Spending Alert',
                    type: 'email'
                })
            );
        });

        it('should handle email failure', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('Test error'));

            await expect(
                service.sendSpendingAlert(mockUser.id, mockUser.email, alertData)
            ).rejects.toThrow('Test error');
        });
    });

    describe('utility functions', () => {
        describe('calculateTotalSpent', () => {
            it('should sum transaction amounts', async () => {
                mockDb.get.mockResolvedValue({
                    docs: [
                        { data: () => ({ Amount: 1000 }) },
                        { data: () => ({ Amount: -500 }) }
                    ]
                });

                const result = await service.calculateTotalSpent(
                    mockUser.id,
                    ['transaction-1', 'transaction-2']
                );

                expect(result).toBe(1500);
            });

            it('should handle empty transactions', async () => {
                mockDb.get.mockResolvedValue({ docs: [] });

                const result = await service.calculateTotalSpent(mockUser.id, []);

                expect(result).toBe(0);
            });

            it('should handle database errors', async () => {
                mockDb.get.mockRejectedValue(new Error('Test error'));

                const result = await service.calculateTotalSpent(mockUser.id, ['transaction-1']);

                expect(result).toBe(0);
            });
        });

        describe('findNextInstalment', () => {
            beforeEach(() => {
                jest.useFakeTimers().setSystemTime(new Date('2024-03-30'));
            });

            afterEach(() => {
                jest.useRealTimers();
            });

            it('should find next instalment', () => {
                const result = service.findNextInstalment(mockLoan);

                expect(result).toEqual({
                    date: expect.any(Date),
                    amount: 3000
                });
            });

            it('should return null when no future instalments', () => {
                jest.setSystemTime(new Date('2024-08-01'));

                const result = service.findNextInstalment(mockLoan);

                expect(result).toBeNull();
            });
        });

        describe('calculateDaysUntil', () => {
            it('should calculate correct days', () => {
                jest.useFakeTimers().setSystemTime(new Date('2024-03-30'));

                const result = service.calculateDaysUntil(new Date('2024-04-01'));

                expect(result).toBe(2);

                jest.useRealTimers();
            });
        });
    });
});