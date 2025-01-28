const express = require('express');

const setupBudgetRoutes = (router, budgetController, authMiddleware) => {
    // Add a budget
    router.post(
        '/add_budget',
        authMiddleware.verifyToken,
        budgetController.addBudget.bind(budgetController)
    );

    // Get all budgets
    router.get(
        '/get_budgets',
        authMiddleware.verifyToken,
        budgetController.getBudgets.bind(budgetController)
    );

    // Update a budget
    router.put(
        '/update_budget/:budgetId',
        authMiddleware.verifyToken,
        budgetController.updateBudget.bind(budgetController)
    );

    // Delete a budget
    router.delete(
        '/delete_budget/:budgetId',
        authMiddleware.verifyToken,
        budgetController.deleteBudget.bind(budgetController)
    );

    router.get(
        '/analytics/summary',
        authMiddleware.verifyToken,
        budgetController.getBudgetSummary.bind(budgetController)
    );

    router.get(
        '/budgetById/',
        authMiddleware.verifyToken,
        budgetController.getBudgetById.bind(budgetController)
    );


    router.get(
        '/transactions/',
        authMiddleware.verifyToken,
        budgetController.getBudgetTransactions.bind(budgetController)
    );

    return router;
};

module.exports = setupBudgetRoutes;