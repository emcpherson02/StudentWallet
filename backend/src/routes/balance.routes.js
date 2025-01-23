const express = require('express');

const setupBalanceRoutes = (router, balanceController, authMiddleware) => {
    router.get(
        '/current',
        authMiddleware.verifyToken,
        balanceController.getCurrentBalance.bind(balanceController)
    );

    router.post(
        '/add',
        authMiddleware.verifyToken,
        balanceController.addToBalance.bind(balanceController)
    );

    router.post(
        '/deduct',
        authMiddleware.verifyToken,
        balanceController.deductFromBalance.bind(balanceController)
    );

    router.post(
        '/set-initial',
        authMiddleware.verifyToken,
        balanceController.setInitialBalance.bind(balanceController)
    );

    return router;
};

module.exports = setupBalanceRoutes;