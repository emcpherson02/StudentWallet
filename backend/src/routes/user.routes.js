const express = require('express');
const { validateUserUpdate } = require('../middleware/validation.middleware');

const setupUserRoutes = (router, userController, authMiddleware) => {
    router.get(
        '/user-data',
        authMiddleware.verifyToken,
        userController.getUserData.bind(userController)
    );

    router.get(
        '/user-details',
        authMiddleware.verifyToken,
        userController.getUserDetails.bind(userController)
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

    router.post(
        '/categories/add',
        authMiddleware.verifyToken,
        userController.addCategory.bind(userController)
    );

    router.get(
        '/categories',
        authMiddleware.verifyToken,
        userController.getCategories.bind(userController)
    );

    router.delete(
        '/categories/:category',
        authMiddleware.verifyToken,
        userController.deleteCategory.bind(userController)
    );

    router.get(
        '/notification-history',
        authMiddleware.verifyToken,
        userController.getNotificationHistory.bind(userController)
    );

    router.put(
        '/email-preferences/:userId',
        authMiddleware.verifyToken,
        userController.updateEmailPreferences.bind(userController)
    );

    router.get(
        '/email-preferences',
        authMiddleware.verifyToken,
        userController.getEmailPreferences.bind(userController)
    );

    router.post(
        '/change-email',
        authMiddleware.verifyToken,
        userController.changeEmail.bind(userController)
    );

    return router;
};

module.exports = setupUserRoutes;