const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

//Add a budget
router.post('/add_budget', async (req, res) => {
    const {userId, category, amount, period, startDate, endDate} = req.body;

    if (!userId || !category || !amount || !period) {
        return res.status(400).json({error: 'Missing fields'});
    }

    try{
        const budget = {
            category,
            amount,
            period,
            spent: 0,
            startDate : startDate ? new Date(startDate) : null,
            endDate : endDate ? new Date(endDate) : null,
        };
        const userDocRef = db.collection('users').doc(userId);
        const budgetsRef = userDocRef.collection('budgets');
        await budgetsRef.add(budget);

        return res.status(201).json({message: 'Budget added successfully'});
    } catch (error) {
        console.error('Error Adding Budget: ', error);
        return res.status(500).json({error: 'Failed to add Budget'});
    }
});


module.exports = router; // Export the router