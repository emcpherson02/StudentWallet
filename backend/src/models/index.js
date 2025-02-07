const UserModel = require('./user.model');
const TransactionModel = require('./transaction.model');
const BudgetModel = require('./budget.model');
const PlaidModel = require('./plaid.model');
const AuthModel = require('./auth.model');
const { db } = require('../config/firebase.config');
const budgetHistoryModel = require('./budgetHistory.model');

module.exports = {
    userModel: new UserModel(db),
    transactionModel: new TransactionModel(db),
    budgetModel: new BudgetModel(db),
    plaidModel: new PlaidModel(db),
    authModel: new AuthModel(db),
    budgetHistoryModel: new budgetHistoryModel(db)
};