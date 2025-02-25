const LoanService = require('../../../src/services/loan.service');
const { DatabaseError, ValidationError, NotFoundError } = require('../../../src/utils/errors');

describe('LoanService', () => {
    let loanService;
    let mockLoanModel;
    let mockTransactionModel;
    let mockLoanNotificationService;

    const mockUserId = 'test-user-id';
    const mockLoanId = 'test-loan-id';

    const mockLoanData = {
        instalmentDates: ['2024-01-01', '2024-04-01', '2024-07-01'],
        instalmentAmounts: [3000, 3000, 3000],
        livingOption: 'away',
        totalAmount: 9000,
        remainingAmount: 9000,
        trackedTransactions: []
    };

    beforeEach(() => {
        mockLoanModel = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            linkTransactionToLoan: jest.fn(),
            removeTransactionFromLoan: jest.fn()
        };

        mockTransactionModel = {
            findByUserId: jest.fn(),
            findById: jest.fn()
        };

        mockLoanNotificationService = {
            checkSpendingThreshold: jest.fn()
        };

        loanService = new LoanService(
            mockLoanModel,
            mockTransactionModel,
            mockLoanNotificationService
        );
    });

    describe('addLoan', () => {
        it('should successfully add a loan with valid data', async () => {
            mockLoanModel.create.mockResolvedValue(mockLoanData);

            const result = await loanService.addLoan(mockUserId, mockLoanData);

            expect(result).toEqual(mockLoanData);
            expect(mockLoanModel.create).toHaveBeenCalledWith(
                mockUserId,
                expect.objectContaining({
                    instalmentDates: mockLoanData.instalmentDates,
                    instalmentAmounts: mockLoanData.instalmentAmounts,
                    livingOption: mockLoanData.livingOption,
                    totalAmount: mockLoanData.totalAmount
                })
            );
        });

        it('should throw ValidationError when required fields are missing', async () => {
            const invalidData = {
                instalmentDates: ['2024-01-01'],
                instalmentAmounts: [3000]
            };

            await expect(loanService.addLoan(mockUserId, invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw ValidationError when instalment counts do not match', async () => {
            const invalidData = {
                ...mockLoanData,
                instalmentDates: ['2024-01-01', '2024-04-01'],
                instalmentAmounts: [3000, 3000, 3000]
            };

            await expect(loanService.addLoan(mockUserId, invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid living option', async () => {
            const invalidData = {
                ...mockLoanData,
                livingOption: 'invalid'
            };

            await expect(loanService.addLoan(mockUserId, invalidData))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw ValidationError when total amount doesnt match instalments', async () => {
            const invalidData = {
                ...mockLoanData,
                totalAmount: 10000 // Different from sum of instalments
            };

            await expect(loanService.addLoan(mockUserId, invalidData))
                .rejects
                .toThrow(ValidationError);
        });
    });

    describe('getLoan', () => {
        it('should return loan with transactions when found', async () => {
            const mockLoan = {
                ...mockLoanData,
                trackedTransactions: ['transaction-1', 'transaction-2']
            };

            const mockTransactions = [
                { id: 'transaction-1', Amount: 1000 },
                { id: 'transaction-2', Amount: 2000 }
            ];

            mockLoanModel.findByUserId.mockResolvedValue([mockLoan]);
            mockTransactionModel.findById
                .mockImplementation((userId, transactionId) =>
                    Promise.resolve(mockTransactions.find(t => t.id === transactionId))
                );

            const result = await loanService.getLoan(mockUserId);

            expect(result).toEqual({
                ...mockLoan,
                transactions: mockTransactions
            });
        });

        it('should return null when no loan is found', async () => {
            mockLoanModel.findByUserId.mockResolvedValue([]);

            const result = await loanService.getLoan(mockUserId);

            expect(result).toBeNull();
        });

        it('should handle database errors gracefully', async () => {
            mockLoanModel.findByUserId.mockRejectedValue(new Error('Database error'));

            await expect(loanService.getLoan(mockUserId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('deleteLoan', () => {
        it('should successfully delete a loan', async () => {
            mockLoanModel.delete.mockResolvedValue(true);

            const result = await loanService.deleteLoan(mockUserId, mockLoanId);

            expect(result).toBe(true);
            expect(mockLoanModel.delete).toHaveBeenCalledWith(mockUserId, mockLoanId);
        });

        it('should throw NotFoundError when loan doesnt exist', async () => {
            mockLoanModel.delete.mockResolvedValue(false);

            await expect(loanService.deleteLoan(mockUserId, mockLoanId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw DatabaseError when deletion fails', async () => {
            mockLoanModel.delete.mockRejectedValue(new Error('Database error'));

            await expect(loanService.deleteLoan(mockUserId, mockLoanId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('linkAllTransactions', () => {
        const mockTransactions = [
            { id: 'transaction-1', Amount: 1000 },
            { id: 'transaction-2', Amount: 2000 }
        ];

        beforeEach(() => {
            mockLoanModel.findByUserId.mockResolvedValue([mockLoanData]);
            mockTransactionModel.findByUserId.mockResolvedValue(mockTransactions);
            mockLoanModel.linkTransactionToLoan.mockResolvedValue(true);
        });

        it('should successfully link all valid transactions', async () => {
            const result = await loanService.linkAllTransactions(mockUserId, mockLoanId);

            expect(result).toEqual({
                message: 'Transactions linked successfully',
                linkedTransactions: 2,
                totalAmount: 3000
            });
            expect(mockLoanNotificationService.checkSpendingThreshold).toHaveBeenCalled();
        });

        it('should handle case when no transactions are found', async () => {
            mockTransactionModel.findByUserId.mockResolvedValue([]);

            const result = await loanService.linkAllTransactions(mockUserId, mockLoanId);

            expect(result).toEqual({
                message: 'No transactions found to link'
            });
        });

        it('should throw NotFoundError when loan doesnt exist', async () => {
            mockLoanModel.findByUserId.mockResolvedValue([]);

            await expect(loanService.linkAllTransactions(mockUserId, mockLoanId))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should skip transactions that would exceed remaining amount', async () => {
            const largeTransactions = [
                { id: 'transaction-1', Amount: 5000 },
                { id: 'transaction-2', Amount: 6000 }
            ];
            mockTransactionModel.findByUserId.mockResolvedValue(largeTransactions);

            const result = await loanService.linkAllTransactions(mockUserId, mockLoanId);

            expect(result.linkedTransactions).toBe(1);
            expect(result.totalAmount).toBe(5000);
        });

        it('should handle database errors during linking', async () => {
            mockLoanModel.linkTransactionToLoan.mockRejectedValue(new Error('Database error'));

            await expect(loanService.linkAllTransactions(mockUserId, mockLoanId))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('updateLoan', () => {
        const updates = {
            instalmentAmounts: [4000, 4000, 4000],
            totalAmount: 12000,
            livingOption: 'home'
        };

        beforeEach(() => {
            mockLoanModel.update.mockResolvedValue({ ...mockLoanData, ...updates });
        });

        it('should successfully update loan with valid data', async () => {
            mockLoanModel.update.mockResolvedValue({ ...mockLoanData, ...updates });

            const result = await loanService.updateLoan(mockUserId, mockLoanId, updates);

            expect(result).toEqual(expect.objectContaining(updates));
            expect(mockLoanModel.update).toHaveBeenCalledWith(
                mockUserId,
                mockLoanId,
                expect.objectContaining(updates)
            );
        });

        it('should throw ValidationError when instalments dont match total', async () => {
            const invalidUpdates = {
                instalmentAmounts: [4000, 4000, 4000],
                totalAmount: 13000
            };

            await expect(loanService.updateLoan(mockUserId, mockLoanId, invalidUpdates))
                .rejects
                .toThrow(ValidationError);
        });

        it('should throw NotFoundError when loan doesnt exist', async () => {
            mockLoanModel.update.mockResolvedValue(null);

            await expect(loanService.updateLoan(mockUserId, mockLoanId, updates))
                .rejects
                .toThrow(NotFoundError);
        });

        it('should throw ValidationError for invalid living option', async () => {
            const invalidUpdates = {
                livingOption: 'invalid'
            };

            await expect(loanService.updateLoan(mockUserId, mockLoanId, invalidUpdates))
                .rejects
                .toThrow(ValidationError);
        });

        it('should create clean update object with only defined values', async () => {
            const partialUpdates = {
                livingOption: 'home'
            };

            await loanService.updateLoan(mockUserId, mockLoanId, partialUpdates);

            expect(mockLoanModel.update).toHaveBeenCalledWith(
                mockUserId,
                mockLoanId,
                expect.objectContaining({
                    livingOption: 'home',
                    lastUpdated: expect.any(String)
                })
            );
        });

        it('should handle database errors during update', async () => {
            mockLoanModel.update.mockRejectedValue(new Error('Database error'));

            await expect(loanService.updateLoan(mockUserId, mockLoanId, updates))
                .rejects
                .toThrow(DatabaseError);
        });
    });

    describe('linkSingleTransaction', () => {
        const mockTransaction = { id: 'transaction-1', Amount: 1000 };

        it('should successfully link a transaction', async () => {
            mockLoanModel.findByUserId.mockResolvedValue([mockLoanData]);
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);
            mockLoanModel.linkTransactionToLoan.mockResolvedValue(true);
            mockTransactionModel.findByUserId.mockResolvedValue([mockTransaction]);

            const result = await loanService.linkSingleTransaction(
                mockUserId,
                mockLoanId,
                mockTransaction.id
            );

            expect(result).toEqual({
                message: 'Transaction linked successfully',
                transactionId: mockTransaction.id,
                amount: mockTransaction.Amount
            });
        });

        it('should throw ValidationError if transaction is already linked', async () => {
            const loanWithLinkedTransaction = {
                ...mockLoanData,
                trackedTransactions: [mockTransaction.id]
            };

            mockLoanModel.findByUserId.mockResolvedValue([loanWithLinkedTransaction]);
            mockTransactionModel.findById.mockResolvedValue(mockTransaction);

            await expect(loanService.linkSingleTransaction(
                mockUserId,
                mockLoanId,
                mockTransaction.id
            )).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError if transaction amount exceeds remaining loan amount', async () => {
            const largeTransaction = { id: 'transaction-1', Amount: 10000 };

            mockLoanModel.findByUserId.mockResolvedValue([mockLoanData]);
            mockTransactionModel.findById.mockResolvedValue(largeTransaction);

            await expect(loanService.linkSingleTransaction(
                mockUserId,
                mockLoanId,
                largeTransaction.id
            )).rejects.toThrow(ValidationError);
        });
    });

    describe('unlinkAllTransactions', () => {
        const mockTransactions = [
            { id: 'transaction-1', Amount: 1000 },
            { id: 'transaction-2', Amount: 2000 }
        ];

        it('should successfully unlink all transactions', async () => {
            const loanWithTransactions = {
                ...mockLoanData,
                trackedTransactions: mockTransactions.map(t => t.id)
            };

            mockLoanModel.findByUserId.mockResolvedValue([loanWithTransactions]);
            mockTransactionModel.findById
                .mockImplementation((userId, transactionId) =>
                    Promise.resolve(mockTransactions.find(t => t.id === transactionId))
                );
            mockLoanModel.removeTransactionFromLoan.mockResolvedValue(true);

            const result = await loanService.unlinkAllTransactions(mockUserId, mockLoanId);

            expect(result).toEqual({
                message: 'Transactions unlinked successfully',
                unlinkedTransactions: 2,
                totalAmount: 3000
            });
        });

        it('should return appropriate message when no transactions to unlink', async () => {
            mockLoanModel.findByUserId.mockResolvedValue([mockLoanData]);

            const result = await loanService.unlinkAllTransactions(mockUserId, mockLoanId);

            expect(result).toEqual({
                message: 'No transactions found to unlink'
            });
        });
    });

    describe('utility methods', () => {
        describe('calculateAvailableAmount', () => {
            it('should correctly calculate available amount based on current date', () => {
                const currentDate = new Date('2024-05-01');
                jest.useFakeTimers().setSystemTime(currentDate);

                const result = loanService.calculateAvailableAmount(mockLoanData);

                // Should include first two instalments as they're before current date
                expect(result).toBe(6000);
            });
        });

        describe('calculateTotalSpent', () => {
            it('should correctly sum absolute values of transaction amounts', () => {
                const transactions = [
                    { Amount: -1000 },
                    { Amount: 2000 },
                    { Amount: -500 }
                ];

                const result = loanService.calculateTotalSpent(transactions);

                expect(result).toBe(3500);
            });
        });
    });
});