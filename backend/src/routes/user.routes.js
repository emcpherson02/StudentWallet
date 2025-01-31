const express = require('express');
const { validateUserUpdate } = require('../middleware/validation.middleware');

const setupUserRoutes = (router, userController, authMiddleware) => {
    router.get(
        '/user-data',
        authMiddleware.verifyToken,
        userController.getUserData.bind(userController)
    );

    router.put(
        '/update_user/:userId',
        authMiddleware.verifyToken,
        validateUserUpdate,
        userController.updateUser.bind(userController)
    );

    router.post(
        '/toggle-notifications',
        authMiddleware.verifyToken,
        userController.toggleNotifications.bind(userController)
    );

    router.delete(
        '/delete_user/:userId',
        userController.deleteUser.bind(userController)
    )

    return router;
};

module.exports = setupUserRoutes;