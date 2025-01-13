const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

router.get('/user-data', async (req, res) => {
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

router.put('/update_user/:userId', async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId || !Object.keys(updates).length) {
        return res.status(400).json({ error: 'Invalid request. Provide a userId and at least one field to update.' });
    }

    try {
        // Construct the dynamic updates object
        const userUpdates = {};
        if (updates.displayName) userUpdates.displayName = updates.displayName;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.dob) userUpdates.dob = new Date(updates.dob);
        if (updates.linkedBank !== undefined) userUpdates.linkedBank = updates.linkedBank;

        // Reference to the user document
        const userRef = db.collection('users').doc(userId);

        // Perform the update
        await userRef.update(userUpdates);

        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ error: 'Failed to update user details' });
    }
});

module.exports = router;