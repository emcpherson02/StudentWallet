const { BaseError } = require('../../utils/errors');
const { MESSAGE_ERROR_OCCURRED } = require('../../utils/constants');
const errorHandler = require('../error.middleware');

jest.mock('../../utils/errors', () => ({
    BaseError: class BaseError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.name = 'BaseError';
            this.message = message;
            this.statusCode = statusCode;
            this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        }
    }
}));

jest.mock('../../utils/constants', () => ({
    MESSAGE_ERROR_OCCURRED: 'An error occurred'
}));

describe('Error Middleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let consoleErrorSpy;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy.mockRestore();
    });

    it('should log error to console', () => {
        const error = new Error('Test error');
        errorHandler(error, mockRequest, mockResponse, mockNext);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should handle BaseError', () => {
        const baseError = new BaseError('Custom error', 400);

        errorHandler(baseError, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Custom error'
        });
    });

    it('should handle Firebase auth errors', () => {
        const error = {
            code: 'auth/invalid-token',
            message: 'Invalid token'
        };

        errorHandler(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'fail',
            message: 'Invalid token'
        });
    });

    it('should handle Plaid errors with status', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    error_message: 'Plaid error'
                }
            }
        };

        errorHandler(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Plaid error'
        });
    });

    it('should handle Plaid errors without status', () => {
        const error = {
            response: {
                data: {
                    error_message: 'Plaid error'
                }
            }
        };

        errorHandler(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            message: 'Plaid error'
        });
    });

    it('should handle Plaid errors without error message', () => {
        const error = {
            response: {
                data: {}
            }
        };

        errorHandler(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            message: MESSAGE_ERROR_OCCURRED
        });
    });

    it('should handle default errors', () => {
        const error = new Error('Random error');

        errorHandler(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            message: MESSAGE_ERROR_OCCURRED
        });
    });

    it('should handle null or undefined errors', () => {
        errorHandler(null, mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            status: 'error',
            message: MESSAGE_ERROR_OCCURRED
        });
    });
});