const setupPlaidRoutes = (router, plaidController, authMiddleware) => {
    /**
     * @swagger
     * /plaid/create_link_token:
     *   post:
     *     tags: [Plaid]
     *     summary: Create a Plaid link token
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               userId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Link token created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 linkToken:
     *                   type: string
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
     *     tags: [Plaid]
     *     summary: Exchange public token for access token
     *     security:
     *       - BearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - publicToken
     *               - userId
     *             properties:
     *               publicToken:
     *                 type: string
     *               userId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Token exchanged successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 accounts:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Account'
     */
    router.post(
        '/exchange_public_token',
        authMiddleware.verifyToken,
        plaidController.exchangePublicToken.bind(plaidController)
    );

    /**
     * @swagger
     * /plaid/accounts/{userId}:
     *   get:
     *     tags: [Plaid]
     *     summary: Get user's linked bank accounts
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: List of accounts retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 accounts:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Account'
     */
    router.get(
        '/accounts/:userId',
        authMiddleware.verifyToken,
        plaidController.getAccounts.bind(plaidController)
    );

    /**
     * @swagger
     * /plaid/transactions/{userId}:
     *   get:
     *     tags: [Plaid]
     *     summary: Get user's transactions
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Start date for transactions (YYYY-MM-DD)
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         description: End date for transactions (YYYY-MM-DD)
     *     responses:
     *       200:
     *         description: Transactions retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 transactions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Transaction'
     */
    router.get(
        '/transactions/:userId',
        authMiddleware.verifyToken,
        plaidController.getTransactions.bind(plaidController)
    );

    /**
     * @swagger
     * /plaid/balances/{userId}:
     *   get:
     *     tags: [Plaid]
     *     summary: Get user's account balances
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Balances retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 balances:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Balance'
     */
    router.get(
        '/balances/:userId',
        authMiddleware.verifyToken,
        plaidController.getBalances.bind(plaidController)
    );

    router.delete(
        '/unlink-bank/:userId',
        authMiddleware.verifyToken,
        plaidController.unlinkBank.bind(plaidController)
    );

    return router;
};

module.exports = setupPlaidRoutes;