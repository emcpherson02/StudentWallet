require('dotenv').config({ path: 'D:/Projects/CSC3032-2425-Team15/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const plaid = require('plaid');
const auth = require('./auth');
const passport = require('passport');
const { createLinkToken, exchangePublicToken, fetchTransactions } = require('./plaid');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: 'https://studentwallet-4e2ca.firebaseio.com'
});

const app = express();
const port = process.env.PORT || 3001;
const db = admin.firestore();

app.use(auth);
// Error Constants
const DB_COLLECTION_USERS = 'users';
const STATUS_FAIL = 'fail';
const STATUS_SUCCESS = 'success';
const MESSAGE_INVALID_CREDENTIALS = 'Invalid credentials';
const MESSAGE_LOGIN_SUCCESSFUL = 'Login successful!';
const MESSAGE_REGISTRATION_SUCCESSFUL = 'Registration successful!';
const MESSAGE_USER_EXISTS = 'User already exists';
const MESSAGE_ERROR_OCCURRED = 'An error occurred. Please try again.';
const MESSAGE_UNAUTHORIZED = 'Unauthorized';
const MESSAGE_USER_NOT_FOUND = 'User not found';
const MESSAGE_INVALID_TOKEN = 'Invalid token';


// Middleware
app.use(bodyParser.json());
app.use(cors());

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Helper functions
const getUserDoc = async (email) => await db.collection(DB_COLLECTION_USERS).doc(email).get();

const loginUser = async (email, password, res) => {
    try {
        const doc = await getUserDoc(email);
        if (!doc.exists || doc.data().password !== password) {
            return res.status(401).json({status: STATUS_FAIL, message: MESSAGE_INVALID_CREDENTIALS});
        }
        const token = await admin.auth().createCustomToken(email);
        return res.json({status: STATUS_SUCCESS, token, message: MESSAGE_LOGIN_SUCCESSFUL});
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({status: STATUS_FAIL, message: MESSAGE_ERROR_OCCURRED});
    }
};

const registerUser = async (name, dob, email, password, res) => {
    try {
        const userDoc = await getUserDoc(email);
        if (userDoc.exists) {
            return res.status(400).json({status: STATUS_FAIL, message: MESSAGE_USER_EXISTS});
        }
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name
        });

        const counterDocRef = db.collection('counters').doc('users');
        const counterDoc = await counterDocRef.get();
        await db.collection(DB_COLLECTION_USERS).doc(email).set({
            name,
            dob,
            email,
            password,
        });

        res.json({ status: STATUS_SUCCESS, message: MESSAGE_REGISTRATION_SUCCESSFUL, uid: userRecord.uid });
    } catch (error) {
        console.error('Error registering:', error);
        res.status(500).json({status: STATUS_FAIL, message: MESSAGE_ERROR_OCCURRED});
    }
}

// Routes
app.get('/', (req, res) => {
    res.send('Hello, StudentWallet Backend!');
});


// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
});
app.get('/user-transactions', async (req, res) => {
    const { userId } = req.query; //Extract the userId from the query parameters
    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' }); //Validate the userId parameter
    }
    try {
        //Retrieve the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        //Retrieve the Transactions subcollection
        const TransactionsSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('Transactions')
            .get();

        if (TransactionsSnapshot.empty) {
            return res.json({ linkedBank: true, Transaction: [] });
        }

        //Map the Transactions subcollection documents to an array of transactions
        const Transaction = TransactionsSnapshot.docs.map((doc) => ({
            type: doc.data().Description,
            amount: doc.data().Amount,
            date: doc.data().Date,
        }));

        res.json({ linkedBank: true, Transaction });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/user-data', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const linkedBank = userDoc.data().linkedBank || false;

        if (!linkedBank) {
            return res.json({ linkedBank: false });
        }

        // Fetch accounts from the 'linkedaccount' subcollection
        const accountsSnapshot = await db.collection('users')
            .doc(userId)
            .collection('LinkedAccounts')
            .get();

        const accounts = accountsSnapshot.docs.map(doc => ({
            type: doc.id, // Use the document ID as the account type
            balance: doc.data().Balance,
        }));

        res.json({ linkedBank: true, accounts });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiates Google authentication
 *     responses:
 *       302:
 *         description: Redirects to Google for authentication
 */
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     responses:
 *       302:
 *         description: Redirects to home after successful authentication
 */
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logs out the user
 *     responses:
 *       200:
 *         description: Successfully logged out and redirected
 */
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Create Plaid link token 
app.post('/create_link_token', async (req, res) => {
    const { userId } = req.body; // Assume userId is passed in the request
    try {
        const linkToken = await createLinkToken(userId);
        res.json({ linkToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exchange public token for access token
app.post('/exchange_public_token', async (req, res) => {
    try {
        const { publicToken, userId } = req.body;

        const { access_token: accessToken, item_id: itemId } = await exchangePublicToken(publicToken);

        // Store the accessToken and itemId in Firestore
        await db.collection('plaid_tokens').doc(userId).set({
            linkedBank: true, // update flag to true
            accessToken,
            itemId,
            createdAt: new Date(), 
        });

        res.status(200).json({ message: 'Public token exchanged and stored successfully!' });
    } catch (error) {
        console.error('Error exchanging public token:', error);
        res.status(500).json({ error: 'Failed to exchange public token' });
    }
});

// Fetch transactions
app.post('/get_transactions', async (req, res) => {
    const { userId, startDate, endDate } = req.body;

    try {
        // Retrieve access token from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists || !userDoc.data().accessToken) {
            return res.status(404).json({ error: 'User or access token not found' });
        }

        const transactions = await fetchTransactions(userDoc.data().accessToken, startDate, endDate);
        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Add Transactions
app.post('/add_transaction', async (req, res) => {
    const { userId, amount, date, description } = req.body; //Extract required parameters from request body

    // Validate required parameters
    if (!userId || !amount || !date || !description) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Create a new transaction object
        const transaction = {
            Amount : amount, // Store the transaction amount
            date :new Date(date), //Convert the date string to a Date object
            Description : description, //Store the transaction description
        };

        // Reference to the user document
        const userDocRef = await db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        // Check if the user exists
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Reference to the Transactions subcollection
        const transactionsRef = userDocRef.collection('Transactions');
        // Add the transaction to the Transactions subcollection
        const docRef = await transactionsRef.add(transaction);

        // Respond with a success message
        res.status(200).json({ message: 'Transaction added successfully' });
    } catch (error) {
        // Log and respond with an error message
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Migration endpoint to add existing Firestore users to Firebase Auth
app.post('/migrate-users', async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const failedMigrations = [];

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const { email, password, name } = userData;

            try {
                // Create Firebase Auth user
                const userRecord = await admin.auth().createUser({
                    email: email,
                    password: password, // Use password as-is or set a default password if necessary
                    displayName: name,
                });

                console.log(`Successfully created Firebase Auth user for ${email}`);

                // Update Firestore with Firebase Auth UID
                await db.collection('users').doc(doc.id).update({
                    authUID: userRecord.uid,
                });

            } catch (error) {
                console.error(`Error migrating user ${email}:`, error);
                failedMigrations.push(email);
            }
        }

        res.json({
            message: 'User migration completed',
            failedMigrations: failedMigrations,
        });
    } catch (error) {
        console.error('Error in migration:', error);
        res.status(500).json({ message: 'Migration failed', error: error.message });
    }
});

