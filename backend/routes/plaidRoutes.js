const express = require('express');
const admin = require('firebase-admin');
const { createLinkToken, exchangePublicToken, fetchTransactions } = require('../plaid');

const router = express.Router();
const db = admin.firestore();

// Create Plaid link token
router.post('/create_link_token', async (req, res) => {
    const { userId } = req.body; // Assume userId is passed in the request
    try {
        const linkToken = await createLinkToken(userId);
        res.json({ linkToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exchange public token for access token
router.post('/exchange_public_token', async (req, res) => {
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
router.post('/get_transactions', async (req, res) => {
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

module.exports = router;