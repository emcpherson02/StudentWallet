const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StudentWallet API',
            version: '1.0.0',
            description: 'API documentation for StudentWallet',
        },
    },
    apis: ['./app.js'], // Path to this file for Swagger documentation
});

module.exports = { swaggerUi, swaggerSpec };
