<<<<<<< Updated upstream
=======
require('dotenv').config({ path: 'D:/Projects/CSC3032-2425-Team15/.env' });
>>>>>>> Stashed changes
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello, StudentWallet Backend!');
});

app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
});
<<<<<<< Updated upstream
=======

app.get('/user-transactions', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
    }
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const TransactionsSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('Transactions')
            .get();

        if (TransactionsSnapshot.empty) {
            return res.json({ linkedBank: true, Transaction: [] });
        }

        const Transaction = TransactionsSnapshot.docs.map((doc) => ({
            type: doc.id,
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

>>>>>>> Stashed changes
