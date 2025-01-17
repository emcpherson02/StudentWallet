const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    failOnErrors: true,
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'StudentWallet API',
            version: '1.0.0',
            description: 'API documentation for StudentWallet financial management system'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3001}`,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        dob: { type: 'string', format: 'date' },
                        linkedBank: { type: 'boolean' }
                    }
                },
                Budget: {
                    type: 'object',
                    properties: {
                        category: { type: 'string' },
                        amount: { type: 'number' },
                        period: { type: 'string' },
                        spent: { type: 'number' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        amount: { type: 'number' },
                        date: { type: 'string', format: 'date-time' },
                        description: { type: 'string' },
                        type: { type: 'string' }
                    }
                }
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ BearerAuth: [] }],
        paths: {
            '/auth/register': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'User registered successfully'
                        },
                        400: {
                            description: 'Invalid request data'
                        }
                    }
                }
            },
            '/auth/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Login user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Login successful'
                        },
                        401: {
                            description: 'Invalid credentials'
                        }
                    }
                }
            },
            '/budget/add_budget': {
                post: {
                    tags: ['Budget'],
                    summary: 'Create a new budget',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Budget'
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Budget created successfully'
                        },
                        400: {
                            description: 'Invalid budget data'
                        }
                    }
                }
            },
            '/budget/get_budgets': {
                get: {
                    tags: ['Budget'],
                    summary: 'Get all budgets for a user',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'userId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'List of budgets'
                        }
                    }
                }
            },
            '/budget/update_budget/{budgetId}': {
                put: {
                    tags: ['Budget'],
                    summary: 'Update a budget',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'budgetId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Budget'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Budget updated successfully'
                        },
                        404: {
                            description: 'Budget not found'
                        }
                    }
                }
            },
            '/budget/delete_budget/{budgetId}': {
                delete: {
                    tags: ['Budget'],
                    summary: 'Delete a budget',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'budgetId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Budget deleted successfully'
                        },
                        404: {
                            description: 'Budget not found'
                        }
                    }
                }
            },
            '/plaid/create_link_token': {
                post: {
                    tags: ['Plaid'],
                    summary: 'Create a Plaid link token',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        userId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Link token created successfully'
                        }
                    }
                }
            },
            '/plaid/exchange_public_token': {
                post: {
                    tags: ['Plaid'],
                    summary: 'Exchange public token for access token',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        publicToken: { type: 'string' },
                                        userId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Token exchanged successfully'
                        }
                    }
                }
            },
            '/transactions/add_transaction': {
                post: {
                    tags: ['Transactions'],
                    summary: 'Add a new transaction',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Transaction'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Transaction added successfully'
                        }
                    }
                }
            },
            '/transactions/user-transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Get user transactions',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'userId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'List of transactions'
                        }
                    }
                }
            },
            '/transactions/delete_transaction/{transactionId}': {
                delete: {
                    tags: ['Transactions'],
                    summary: 'Delete a transaction',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'transactionId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Transaction deleted successfully'
                        },
                        404: {
                            description: 'Transaction not found'
                        }
                    }
                }
            },
            '/user/user-data': {
                get: {
                    tags: ['User'],
                    summary: 'Get user data',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'userId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'User data retrieved successfully'
                        }
                    }
                }
            },
            '/user/update_user/{userId}': {
                put: {
                    tags: ['User'],
                    summary: 'Update user details',
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'userId',
                            required: true,
                            schema: {
                                type: 'string'
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'User updated successfully'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec
};