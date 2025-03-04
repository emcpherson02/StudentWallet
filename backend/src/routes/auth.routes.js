const express = require('express');

const setupAuthRoutes = (router, authController) => {
    /**
     * @swagger
     * /auth/login:
     *   post:
     *     tags: [Authentication]
     *     summary: Login user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login successful or MFA required
     *       401:
     *         description: Invalid credentials
     */
    router.post('/login', authController.login.bind(authController));

    /**
     * @swagger
     * /auth/verify-mfa:
     *   post:
     *     tags: [Authentication]
     *     summary: Verify MFA code and complete login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *               verificationCode:
     *                 type: string
     *     responses:
     *       200:
     *         description: MFA verification successful
     *       401:
     *         description: Invalid verification code
     */
    router.post('/verify-mfa', authController.verifyMfaAndLogin.bind(authController));

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     tags: [Authentication]
     *     summary: Register a new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               dob:
     *                 type: string
     *                 format: date
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *     responses:
     *       201:
     *         description: User registered successfully
     *       400:
     *         description: Invalid request data
     */
    router.post('/register', authController.register.bind(authController));

    return router;
};

module.exports = setupAuthRoutes;