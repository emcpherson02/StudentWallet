const UserModel = require('./user.model');
const TransactionModel = require('./transaction.model');
const BudgetModel = require('./budget.model');
const PlaidModel = require('./plaid.model');  // Add this import
const { db } = require('../config/firebase.config');

module.exports = {
    userModel: new UserModel(db),
    transactionModel: new TransactionModel(db),
    budgetModel: new BudgetModel(db),
    plaidModel: new PlaidModel(db)
};