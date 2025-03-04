require('dotenv').config({ path: 'D:/Projects/CSC3032-2425-Team15/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

// Import configurations
const { admin, db } = require('./config/firebase.config');
const { swaggerUi, swaggerSpec } = require('./config/swagger.config');
const initializePassport = require('./config/passport.config');

// Import models
const { authModel, userModel, transactionModel, budgetModel, plaidModel,
    budgetHistoryModel, loanModel, mfaModel } = require('./models');

// Import services
const AuthService = require('./services/auth.service');
const PlaidService = require('./services/plaid.service');
const TransactionService = require('./services/transaction.service');
const BudgetService = require('./services/budget.service');
const UserService = require('./services/user.service');
const BudgetNotificationService = require('./services/budget.notification.service');
const BudgetRolloverService = require('./services/budgetRollover.service');
const BudgetAnalyticsService = require('./services/budgetAnalytics.service');
const LoanService = require('./services/loan.service');
const BudgetRolloverSchedulerService = require('./services/budgetRolloverScheduler.service');
const LoanNotificationService = require('./services/loan.notification.service');
const DataExportService = require('./services/dataExport.service');
const MfaService = require('./services/mfa.service');

// Import controllers
const AuthController = require('./controllers/auth.controller');
const PlaidController = require('./controllers/plaid.controller');
const TransactionController = require('./controllers/transaction.controller');
const BudgetController = require('./controllers/budget.controller');
const UserController = require('./controllers/user.controller');
const BudgetHistoryController = require('./controllers/budgetHistory.controller');
const LoanController = require('./controllers/loan.controller');
const DataExportController = require('./controllers/dataExport.controller');
const MfaController = require('./controllers/mfa.controller');

// Import middleware
const AuthMiddleware = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.middleware');

// Import route setups
const setupBudgetRoutes = require('./routes/budget.routes');
const setupPlaidRoutes = require('./routes/plaid.routes');
const setupTransactionRoutes = require('./routes/transaction.routes');
const setupUserRoutes = require('./routes/user.routes');
const setupBudgetHistoryRoutes = require('./routes/budgetHistory.routes');
const setupLoanRoutes = require('./routes/loan.routes');
const setupExportRoutes = require('./routes/export.routes');
const setupMfaRoutes = require('./routes/mfa.routes');
const setupAuthRoutes = require('./routes/auth.routes');

const app = express();
const port = process.env.PORT || 3001;

// Initialize services with models
const budgetNotificationService = new BudgetNotificationService(userModel);
const loanNotificationService = new LoanNotificationService(userModel, loanModel);
const mfaService = new MfaService(mfaModel, userModel);
const authService = new AuthService(authModel, mfaModel);
const userService = new UserService(userModel, budgetModel, budgetNotificationService);
const plaidService = new PlaidService(plaidModel, budgetModel, budgetNotificationService);
const transactionService = new TransactionService(transactionModel, budgetModel, budgetNotificationService);
const budgetService = new BudgetService(budgetModel, transactionModel, budgetNotificationService, userModel);
const budgetRolloverService = new BudgetRolloverService(budgetModel, budgetHistoryModel, budgetNotificationService);
const budgetAnalyticsService = new BudgetAnalyticsService(budgetHistoryModel);
const budgetRolloverSchedulerService = new BudgetRolloverSchedulerService(budgetService, budgetRolloverService);
const dataExportService = new DataExportService(userModel, transactionModel, budgetModel, loanModel, budgetHistoryModel, budgetAnalyticsService);
const loanService = new LoanService(loanModel, transactionModel, loanNotificationService);

// Initialize controllers
const authController = new AuthController(authService, mfaService);
const plaidController = new PlaidController(plaidService);
const transactionController = new TransactionController(transactionService);
const budgetController = new BudgetController(budgetService);
const userController = new UserController(userService);
const budgetHistoryController = new BudgetHistoryController(budgetRolloverService, budgetAnalyticsService);
const loanController = new LoanController(loanService);
const dataExportController = new DataExportController(dataExportService);
const mfaController = new MfaController(mfaService);

// Initialize middleware
const authMiddleware = new AuthMiddleware(authService);

// Initialize Passport
const passport = initializePassport(userService);

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Setup routes
app.use('/auth', setupAuthRoutes(express.Router(), authController));
app.use('/budget', setupBudgetRoutes(express.Router(), budgetController, authMiddleware));
app.use('/plaid', setupPlaidRoutes(express.Router(), plaidController, authMiddleware));
app.use('/transactions', setupTransactionRoutes(express.Router(), transactionController, authMiddleware));
app.use('/user', setupUserRoutes(express.Router(), userController, authMiddleware));
app.use('/history', setupBudgetHistoryRoutes(express.Router(), budgetHistoryController, authMiddleware));
app.use('/loan', setupLoanRoutes(express.Router(), loanController, authMiddleware));
app.use('/mfa', setupMfaRoutes(express.Router(), mfaController, authMiddleware));
app.get('/exports/financial-data', authMiddleware.verifyToken, dataExportController.exportUserData.bind(dataExportController));

// OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    authController.googleAuthCallback.bind(authController)
);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
});

module.exports = app;