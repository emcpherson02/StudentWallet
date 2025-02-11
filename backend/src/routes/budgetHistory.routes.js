const express = require('express');

const setupBudgetHistoryRoutes = (router, budgetHistoryController, authMiddleware) => {
    router.post(
        '/rollover',
        authMiddleware.verifyToken,
        budgetHistoryController.processRollover.bind(budgetHistoryController)
    );

    router.get(
        '/analytics',
        authMiddleware.verifyToken,
        budgetHistoryController.getAnalytics.bind(budgetHistoryController)
    );

    return router;
};

module.exports = setupBudgetHistoryRoutes;