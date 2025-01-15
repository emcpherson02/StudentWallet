const UserModel = require('./user.model');
const TransactionModel = require('./transaction.model');
const BudgetModel = require('./budget.model');
const { db } = require('../config/firebase.config');

module.exports = {
    userModel: new UserModel(db),
    transactionModel: new TransactionModel(db),
    budgetModel: new BudgetModel(db)
};