const setupMfaRoutes = (router, mfaController, authMiddleware) => {
    /**
     * @swagger
     * /mfa/enable:
     *   post:
     *     tags: [MFA]
     *     summary: Enable MFA for a user
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
     *               - phoneNumber
     *             properties:
     *               userId:
     *                 type: string
     *               phoneNumber:
     *                 type: string
     *     responses:
     *       200:
     *         description: MFA enabled successfully
     */
    router.post(
        '/enable',
        authMiddleware.verifyToken,
        mfaController.enableMfa.bind(mfaController)
    );

    /**
     * @swagger
     * /mfa/disable:
     *   post:
     *     tags: [MFA]
     *     summary: Disable MFA for a user
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
     *         description: MFA disabled successfully
     */
    router.post(
        '/disable',
        authMiddleware.verifyToken,
        mfaController.disableMfa.bind(mfaController)
    );

    /**
     * @swagger
     * /mfa/status:
     *   get:
     *     tags: [MFA]
     *     summary: Get MFA status for a user
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: MFA status retrieved successfully
     */
    router.get(
        '/status',
        authMiddleware.verifyToken,
        mfaController.getMfaStatus.bind(mfaController)
    );

    /**
     * @swagger
     * /mfa/send-code:
     *   post:
     *     tags: [MFA]
     *     summary: Send verification code to user's phone
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
     *         description: Verification code sent successfully
     */
    router.post(
        '/send-code',
        mfaController.sendVerificationCode.bind(mfaController)
    );

    /**
     * @swagger
     * /mfa/verify-code:
     *   post:
     *     tags: [MFA]
     *     summary: Verify MFA code
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - code
     *             properties:
     *               userId:
     *                 type: string
     *               code:
     *                 type: string
     *     responses:
     *       200:
     *         description: Code verified successfully
     */
    router.post(
        '/verify-code',
        mfaController.verifyCode.bind(mfaController)
    );

    return router;
};

module.exports = setupMfaRoutes;