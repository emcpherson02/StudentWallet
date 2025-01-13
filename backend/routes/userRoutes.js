const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();
const db = admin.firestore();

router.get('/user-data', async (req, res) => {
    const { userId } = req.query; // Extract the userId from the query parameters

    if (!userId) { // Validate the userId parameter
        return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try { // Fetch the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const linkedBank = userDoc.data().linkedBank || false; // Check if the user has linked a bank account

        if (!linkedBank) { // If the user has not linked a bank account, return a response with the linkedBank status
            return res.json({ linkedBank: false });
        }

        // Fetch accounts from the 'linkedaccount' subcollection
        const accountsSnapshot = await db.collection('users')
            .doc(userId)
            .collection('LinkedAccounts')
            .get();

        // Map the accounts to an array of objects
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
    const { userId } = req.params; // Extract the userId from the request parameters
    const updates = req.body; // Extract the updates object from the request body

    if (!userId || !Object.keys(updates).length) { // Validate the request
        return res.status(400).json({ error: 'Invalid request. Provide a userId and at least one field to update.' });
    }

    try {
        // Construct the dynamic updates object
        const userUpdates = {};
        if (updates.displayName) userUpdates.displayName = updates.displayName; // Check if the displayName field is provided
        if (updates.email) userUpdates.email = updates.email; // Check if the email field is provided
        if (updates.dob) userUpdates.dob = new Date(updates.dob); // Check if the dob field is provided
        if (updates.linkedBank !== undefined) userUpdates.linkedBank = updates.linkedBank; // Check if the linkedBank field is provided

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