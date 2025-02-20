jest.mock('../../../src/models/user.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'UserModel'
    }));
});

jest.mock('../../../src/models/transaction.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'TransactionModel'
    }));
});

jest.mock('../../../src/models/budget.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'BudgetModel'
    }));
});

jest.mock('../../../src/models/plaid.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'PlaidModel'
    }));
});

jest.mock('../../../src/models/auth.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'AuthModel'
    }));
});

jest.mock('../../../src/models/loan.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'LoanModel'
    }));
});

jest.mock('../../../src/models/budgetHistory.model', () => {
    return jest.fn().mockImplementation(() => ({
        type: 'BudgetHistoryModel'
    }));
});

jest.mock('../../../src/config/firebase.config', () => ({
    db: {
        type: 'FirestoreDB'
    }
}));

describe('Models Index', () => {
    let models;
    let UserModel;
    let TransactionModel;
    let BudgetModel;
    let PlaidModel;
    let AuthModel;
    let LoanModel;
    let BudgetHistoryModel;

    beforeEach(() => {
        jest.clearAllMocks();

        UserModel = require('../../../src/models/user.model');
        TransactionModel = require('../../../src/models/transaction.model');
        BudgetModel = require('../../../src/models/budget.model');
        PlaidModel = require('../../../src/models/plaid.model');
        AuthModel = require('../../../src/models/auth.model');
        LoanModel = require('../../../src/models/loan.model');
        BudgetHistoryModel = require('../../../src/models/budgetHistory.model');

        models = require('../../../src/models');
    });

    afterEach(() => {
        jest.resetModules();
    });

    it('should export all required models', () => {
        expect(models).toHaveProperty('userModel');
        expect(models).toHaveProperty('transactionModel');
        expect(models).toHaveProperty('budgetModel');
        expect(models).toHaveProperty('plaidModel');
        expect(models).toHaveProperty('authModel');
        expect(models).toHaveProperty('budgetHistoryModel');
        expect(models).toHaveProperty('loanModel');
    });

    it('should initialize UserModel with db instance', () => {
        expect(UserModel).toHaveBeenCalledTimes(1);
        expect(UserModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.userModel.type).toBe('UserModel');
    });

    it('should initialize TransactionModel with db instance', () => {
        expect(TransactionModel).toHaveBeenCalledTimes(1);
        expect(TransactionModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.transactionModel.type).toBe('TransactionModel');
    });

    it('should initialize BudgetModel with db instance', () => {
        expect(BudgetModel).toHaveBeenCalledTimes(1);
        expect(BudgetModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.budgetModel.type).toBe('BudgetModel');
    });

    it('should initialize PlaidModel with db instance', () => {
        expect(PlaidModel).toHaveBeenCalledTimes(1);
        expect(PlaidModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.plaidModel.type).toBe('PlaidModel');
    });

    it('should initialize AuthModel with db instance', () => {
        expect(AuthModel).toHaveBeenCalledTimes(1);
        expect(AuthModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.authModel.type).toBe('AuthModel');
    });

    it('should initialize BudgetHistoryModel with db instance', () => {
        expect(BudgetHistoryModel).toHaveBeenCalledTimes(1);
        expect(BudgetHistoryModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.budgetHistoryModel.type).toBe('BudgetHistoryModel');
    });

    it('should initialize LoanModel with db instance', () => {
        expect(LoanModel).toHaveBeenCalledTimes(1);
        expect(LoanModel).toHaveBeenCalledWith(expect.objectContaining({
            type: 'FirestoreDB'
        }));
        expect(models.loanModel.type).toBe('LoanModel');
    });

    it('should create only one instance of each model', () => {
        const modelsSecondLoad = require('../../../src/models');

        expect(UserModel).toHaveBeenCalledTimes(1);
        expect(TransactionModel).toHaveBeenCalledTimes(1);
        expect(BudgetModel).toHaveBeenCalledTimes(1);
        expect(PlaidModel).toHaveBeenCalledTimes(1);
        expect(AuthModel).toHaveBeenCalledTimes(1);
        expect(BudgetHistoryModel).toHaveBeenCalledTimes(1);
        expect(LoanModel).toHaveBeenCalledTimes(1);

        expect(modelsSecondLoad.userModel).toBe(models.userModel);
        expect(modelsSecondLoad.transactionModel).toBe(models.transactionModel);
        expect(modelsSecondLoad.budgetModel).toBe(models.budgetModel);
        expect(modelsSecondLoad.plaidModel).toBe(models.plaidModel);
        expect(modelsSecondLoad.authModel).toBe(models.authModel);
        expect(modelsSecondLoad.budgetHistoryModel).toBe(models.budgetHistoryModel);
        expect(modelsSecondLoad.loanModel).toBe(models.loanModel);
    });
});