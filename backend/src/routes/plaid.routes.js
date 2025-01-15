const express = require('express');

const setupPlaidRoutes = (router, plaidController, authMiddleware) => {
    /**
     * @swagger
     * /plaid/create_link_token:
     *   post:
     *     security:
     *       - BearerAuth: []
     *     summary: Create a Plaid link token
     */
    router.post(
        '/create_link_token',
        authMiddleware.verifyToken,
        plaidController.createLinkToken.bind(plaidController)
    );

    /**
     * @swagger
     * /plaid/exchange_public_token:
     *   post:
     *     security:
     *       - BearerAuth: []
     *     summary: Exchange public token for access token
     */
    router.post(
        '/exchange_public_token',
        authMiddleware.verifyToken,
        plaidController.exchangePublicToken.bind(plaidController)
    );

    router.post(
        '/get_transactions',
        authMiddleware.verifyToken,
        plaidController.getTransactions.bind(plaidController)
    );

    return router;
};

module.exports = setupPlaidRoutes;