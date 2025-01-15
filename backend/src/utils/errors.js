class BaseError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthenticationError extends BaseError {
    constructor(message) {
        super(message, 401);
    }
}

class DatabaseError extends BaseError {
    constructor(message) {
        super(message, 500);
    }
}

class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400);
    }
}

class NotFoundError extends BaseError {
    constructor(message) {
        super(message, 404);
    }
}

module.exports = {
    BaseError,
    AuthenticationError,
    DatabaseError,
    ValidationError,
    NotFoundError
};