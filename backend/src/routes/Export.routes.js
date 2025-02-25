const express = require('express');

const setupExportRoutes = (router, dataExportController, authMiddleware) => {
    router.get(
        '/exports/financial-data',
        authMiddleware.verifyToken,
        authMiddleware.validateDateRange,
        dataExportController.exportUserData.bind(dataExportController)
    );

    return router;
};

// Middleware for date validation
const validateDateRange = (req, res, next) => {
    const { startDate, endDate } = req.query;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
            status: 'error',
            message: 'Start date must be before end date'
        });
    }

    next();
};

module.exports = {
    setupExportRoutes,
    validateDateRange
};