const setupExportRoutes = (router, dataExportController, authMiddleware) => {
    router.get(
        '/export-data',
        authMiddleware.verifyToken,
        dataExportController.exportUserData.bind(dataExportController)
    );

    return router;
};

module.exports = setupExportRoutes;