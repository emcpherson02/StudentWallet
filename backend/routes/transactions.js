const express = require ('express');
const admin = require ('firebase-admin');
const { // Import the constants from the constants file
    MESSAGE_USER_NOT_FOUND
} = require('../utils/constants');


const router = express.Router ();
const db = admin.firestore ();

// Add a transaction
router.post('/add_transaction', async (req, res) => {
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
            return res.status(404).json({MESSAGE_USER_NOT_FOUND});
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

// Get all transactions
router.get('/user-transactions', async (req, res) => {
    const { userId } = req.query; //Extract the userId from the query parameters
    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' }); //Validate the userId parameter
    }
    try {
        //Retrieve the user document from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ MESSAGE_USER_NOT_FOUND });
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
            date: doc.data().date,
        }));

        res.json({ linkedBank: true, Transaction });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Delete a transaction
router.delete('/delete_transaction/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const { userId } = req.body;

    if (!transactionId || !userId) {
        return res.status(400).json({ error: 'Missing required parameters: transactionId and userId' });
    }

    try {
        // Reference to the user's transaction
        const transactionRef = db.collection('users').doc(userId).collection('Transactions').doc(transactionId);

        // Check if the transaction exists
        const transactionDoc = await transactionRef.get();
        if (!transactionDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Delete the transaction
        await transactionRef.delete();

        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;
