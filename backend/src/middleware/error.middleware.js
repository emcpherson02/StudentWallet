const { BaseError } = require('../utils/errors');
const { MESSAGE_ERROR_OCCURRED } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Handle Firebase Admin errors
    if (err.code && err.code.startsWith('auth/')) {
        return res.status(401).json({
            status: 'fail',
            message: err.message
        });
    }

    // Handle Plaid errors
    if (err.response?.data) {
        return res.status(err.response.status || 500).json({
            status: 'error',
            message: err.response.data.error_message || MESSAGE_ERROR_OCCURRED
        });
    }

    // Default error
    res.status(500).json({
        status: 'error',
        message: MESSAGE_ERROR_OCCURRED
    });
};

module.exports = errorHandler;