jest.mock('../../../src/utils/errors', () => ({
    ValidationError: jest.fn().mockImplementation((message) => ({
        message,
        name: 'ValidationError',
        statusCode: 400,
        status: 'fail'
    }))
}));

const { ValidationError } = require('../../../src/utils/errors');
const {
    validateTransaction,
    validateBudget,
    validateUserUpdate
} = require('../../../src/middleware/validation.middleware');

describe('Validation Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;

    beforeEach(() => {
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        ValidationError.mockClear();
    });

    describe('validateTransaction', () => {
        it('should pass validation with all required fields', () => {
            mockRequest = {
                body: {
                    userId: 'user123',
                    amount: 100,
                    date: '2024-02-10',
                    description: 'Test transaction'
                }
            };

            validateTransaction(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(ValidationError).not.toHaveBeenCalled();
        });

        it('should fail validation when userId is missing', () => {
            mockRequest = {
                body: {
                    amount: 100,
                    date: '2024-02-10',
                    description: 'Test transaction'
                }
            };

            validateTransaction(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required parameters');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when amount is missing', () => {
            mockRequest = {
                body: {
                    userId: 'user123',
                    date: '2024-02-10',
                    description: 'Test transaction'
                }
            };

            validateTransaction(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required parameters');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when multiple fields are missing', () => {
            mockRequest = {
                body: {
                    userId: 'user123'
                }
            };

            validateTransaction(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required parameters');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('validateBudget', () => {
        it('should pass validation with all required fields', () => {
            mockRequest = {
                body: {
                    userId: 'user123',
                    category: 'Food',
                    amount: 500,
                    period: 'monthly'
                }
            };

            validateBudget(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(ValidationError).not.toHaveBeenCalled();
        });

        it('should fail validation when userId is missing', () => {
            mockRequest = {
                body: {
                    category: 'Food',
                    amount: 500,
                    period: 'monthly'
                }
            };

            validateBudget(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required fields');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when category is missing', () => {
            mockRequest = {
                body: {
                    userId: 'user123',
                    amount: 500,
                    period: 'monthly'
                }
            };

            validateBudget(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required fields');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when multiple fields are missing', () => {
            mockRequest = {
                body: {
                    userId: 'user123'
                }
            };

            validateBudget(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith('Missing required fields');
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('validateUserUpdate', () => {
        it('should pass validation with valid userId and updates', () => {
            mockRequest = {
                params: {
                    userId: 'user123'
                },
                body: {
                    name: 'John Doe',
                    email: 'john@example.com'
                }
            };

            validateUserUpdate(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledWith();
            expect(ValidationError).not.toHaveBeenCalled();
        });

        it('should fail validation when userId is missing', () => {
            mockRequest = {
                params: {},
                body: {
                    name: 'John Doe'
                }
            };

            validateUserUpdate(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith(
                'Invalid request. Provide a userId and at least one field to update.'
            );
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when updates are empty', () => {
            mockRequest = {
                params: {
                    userId: 'user123'
                },
                body: {}
            };

            validateUserUpdate(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith(
                'Invalid request. Provide a userId and at least one field to update.'
            );
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });

        it('should fail validation when both userId and updates are missing', () => {
            mockRequest = {
                params: {},
                body: {}
            };

            validateUserUpdate(mockRequest, mockResponse, mockNext);

            expect(ValidationError).toHaveBeenCalledWith(
                'Invalid request. Provide a userId and at least one field to update.'
            );
            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });
    });
});