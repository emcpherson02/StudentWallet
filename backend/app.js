require('dotenv').config({ path: 'D:/Projects/CSC3032-2425-Team15/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const auth = require('./auth');
const passport = require('passport');

const {
    DB_COLLECTION_USERS,
    STATUS_FAIL,
    STATUS_SUCCESS,
    MESSAGE_INVALID_CREDENTIALS,
    MESSAGE_LOGIN_SUCCESSFUL,
    MESSAGE_REGISTRATION_SUCCESSFUL,
    MESSAGE_USER_EXISTS,
    MESSAGE_ERROR_OCCURRED,
} = require('./utils/constants');

// Initialize Firebase Admin SDK
const { admin, db } = require('./utils/firebase');


const app = express();
const port = process.env.PORT || 3001;


const budgetRoutes = require('./routes/budget');
const plaidRoutes = require('./routes/plaidRoutes');
const transactionsRoutes = require('./routes/transactions');


app.use(auth);



// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/budget', budgetRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/plaid', plaidRoutes);

// Swagger
const { swaggerUi, swaggerSpec } = require('./utils/swagger');
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
