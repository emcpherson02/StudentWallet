const express = require('express');
const { validateTransaction } = require('../middleware/validation.middleware');

const setupTransactionRoutes = (router, transactionController, authMiddleware) => {
    /**
     * @swagger
     * /transactions/add_transaction:
     *   post:
     *     security:
     *       - BearerAuth: []
     *     summary: Add a new transaction
     */
    router.post(
        '/add_transaction',
        authMiddleware.verifyToken,
        validateTransaction,
        transactionController.addTransaction.bind(transactionController)
    );

    router.get(
        '/user-transactions',
        authMiddleware.verifyToken,
        transactionController.getUserTransactions.bind(transactionController)
    );

    router.delete(
        '/delete_transaction/:transactionId',
        authMiddleware.verifyToken,
        transactionController.deleteTransaction.bind(transactionController)
    );

    router.get(
        '/analytics',
        authMiddleware.verifyToken,
        transactionController.getTransactionAnalytics.bind(transactionController)
    );

    return router;
};

module.exports = setupTransactionRoutes;