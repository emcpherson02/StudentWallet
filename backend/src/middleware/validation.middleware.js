const { ValidationError } = require('../utils/errors');

const validateTransaction = (req, res, next) => {
    const { userId, amount, date, description, transactionType } = req.body;

    if (!userId || !amount || !date || !description || !transactionType) {
        return next(new ValidationError('Missing required parameters'));
    }

    if (!['expense', 'income'].includes(transactionType)) {
        return next(new ValidationError('Invalid transaction type'));
    }

    next();
};

const validateBudget = (req, res, next) => {
    const { userId, category, amount, period } = req.body;

    if (!userId || !category || !amount || !period) {
        return next(new ValidationError('Missing required fields'));
    }

    next();
};

const validateUserUpdate = (req, res, next) => {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId || !Object.keys(updates).length) {
        return next(new ValidationError('Invalid request. Provide a userId and at least one field to update.'));
    }

    next();
};

module.exports = {
    validateTransaction,
    validateBudget,
    validateUserUpdate
};