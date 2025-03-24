const EmailSummaryService = require('../../../src/services/EmailSummaryService');
const { DatabaseError, ValidationError, NotFoundError } = require('../../../src/utils/errors');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('EmailSummaryService', () => {
    let emailSummaryService;
    let mockUserModel;
    let mockTransactionModel;
    let mockBudgetService;
    let mockLoanModel;
    let mockBudgetAnalyticsService;
    let mockTransporter;

    const mockUser = {
        id: 'user-1',
        email: 'test@student.com',
        displayName: 'Test User',
        emailPreferences: {
            weeklySummary: true,
            includeTransactions: true,
            includeBudgets: true,
            includeLoans: true,
            includeRecommendations: true
        },
        db: {  // Add db mock structure
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'notification-1' })
        }
    };

    beforeEach(() => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue(true)
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        mockUserModel = {
            findAllWithNotifications: jest.fn().mockResolvedValue([mockUser]),
            getEmailPreferences: jest.fn().mockResolvedValue(mockUser.emailPreferences),
            findById: jest.fn().mockResolvedValue(mockUser),
            db: mockUser.db  // Add db reference
        };

        mockTransactionModel = {
            findByUserId: jest.fn().mockResolvedValue([{
                id: 'tx1',
                Amount: 100,
                category: 'Food',
                date: new Date().toISOString()
            }])
        };

        mockBudgetService = {
            getBudgetSummary: jest.fn().mockResolvedValue({
                totalSpent: 100,
                categoryBreakdown: [{
                    category: 'Food',
                    percentageUsed: 90,
                    budgetAmount: 500,
                    spent: 450,
                    remaining: 50
                }]
            })
        };

        mockLoanModel = {
            findByUserId: jest.fn().mockResolvedValue([{
                totalAmount: 1000,
                remainingAmount: 500,
                instalmentDates: [new Date(Date.now() + 86400000).toISOString()], // Tomorrow
                instalmentAmounts: [200]
            }])
        };

        mockBudgetAnalyticsService = {
            analyzeSpending: jest.fn()
        };

        emailSummaryService = new EmailSummaryService(
            mockUserModel,
            mockTransactionModel,
            mockBudgetService,
            mockLoanModel,
            mockBudgetAnalyticsService
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('processWeeklySummaries', () => {
        it('should process users with enabled notifications', async () => {
            await emailSummaryService.processWeeklySummaries();
            expect(mockUserModel.findAllWithNotifications).toHaveBeenCalled();
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should continue processing after individual user failures', async () => {
            mockUserModel.findAllWithNotifications.mockResolvedValue([mockUser, mockUser]);
            mockUserModel.getEmailPreferences.mockRejectedValueOnce(new Error('DB error'));

            await emailSummaryService.processWeeklySummaries();
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        });
    });

    describe('generateAndSendSummary', () => {
        it('should generate and send summary with valid preferences', async () => {
            await emailSummaryService.generateAndSendSummary(mockUser.id);
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should use default preferences when none exist', async () => {
            mockUserModel.getEmailPreferences.mockResolvedValueOnce(null);
            await emailSummaryService.generateAndSendSummary(mockUser.id);
            expect(mockBudgetService.getBudgetSummary).toHaveBeenCalled();
        });

    });

    describe('generateWeeklySummary', () => {
        it('should generate complete summary data', async () => {
            const result = await emailSummaryService.generateWeeklySummary(mockUser.id);
            expect(result.totalSpent).toBe(100);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });


        it('should handle budget summary failure', async () => {
            mockBudgetService.getBudgetSummary.mockRejectedValueOnce(new Error('DB error'));
            await expect(emailSummaryService.generateWeeklySummary(mockUser.id))
                .rejects.toThrow(DatabaseError);
        });
    });

    describe('formatEmailContent', () => {
        const mockSummaryData = {
            user: mockUser,
            dateRange: { startDate: '2024-01-01', endDate: '2024-01-07' },
            totalSpent: 150,
            weeklyTransactions: [],
            budgetSummary: {
                categoryBreakdown: [{
                    category: 'Food',
                    budgetAmount: 500,
                    spent: 250,
                    remaining: 250,
                    percentageUsed: "50.00"
                }]
            },
            recommendations: [{ type: 'tip', message: 'Test tip' }]
        };

        it('should generate valid email HTML', () => {
            const result = emailSummaryService.formatEmailContent(mockSummaryData);
            expect(result.html).toContain('Weekly Financial Summary');
            expect(result.subject).toContain('Weekly Financial Summary');
        });

        it('should respect email preferences', () => {
            const result = emailSummaryService.formatEmailContent(mockSummaryData, { includeBudgets: false });
            expect(result.html).not.toContain('Budget Status');
        });
    });

    describe('sendSummaryEmail', () => {
        it('should send email to valid user', async () => {
            const emailContent = { subject: 'Test', html: '<p>Test</p>' };
            await emailSummaryService.sendSummaryEmail(mockUser.id, emailContent);
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should throw error for user without email', async () => {
            mockUserModel.findById.mockResolvedValueOnce({ ...mockUser, email: null });
            await expect(emailSummaryService.sendSummaryEmail(mockUser.id, {}))
                .rejects.toThrow('User email not found');
        });
    });

    describe('error handling', () => {
        it('should throw DatabaseError on database failure', async () => {
            mockUserModel.findAllWithNotifications.mockRejectedValue(new Error('DB error'));
            await expect(emailSummaryService.processWeeklySummaries())
                .rejects.toThrow(DatabaseError);
        });

        it('should throw ValidationError for invalid inputs', async () => {
            await expect(emailSummaryService.generateAndSendSummary())
                .rejects.toThrow(ValidationError);
        });
    });
});


