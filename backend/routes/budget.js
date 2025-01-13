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

//Get all budgets
router.get('/get_budgets', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({error: 'Missing fields'});
    }

    try {
        const budgetSnapshot = await db.collection('users').doc(userId).collection('budgets').get();
        const budgets = budgetSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));


        res.status(200).json({budgets});
    } catch (error) {
        console.error('Error Getting Budgets: ', error);
        return res.status(500).json({error: 'Failed to get Budgets'});
    }
});

router.put('/update_budget/:budgetId', async (req, res) => {
    const { userId, category, amount, period, spent, startDate, endDate } = req.body;
    const { budgetId } = req.params;

    if (!userId || !budgetId) {
        res.status(400).json({error: 'Missing fields'});
    }

    try {
        const budgetUpdates = {
            ...(category && {category}),
            ...(amount && {amount}),
            ...(period && {period}),
            ...(spent && {spent}),
            ...(startDate && {startDate: new Date(startDate)}),
            ...(endDate && {endDate: new Date(endDate)}),
        };
        const budgetRef = db.collection('users').doc(userId).collection('budgets').doc(budgetId);
        await budgetRef.update(budgetUpdates);

        res.status(200).json({message: 'Budget updated successfully'});
    }catch (error) {
        console.error('Error Updating Budget: ', error);
        return res.status(500).json({error: 'Failed to update Budget'});
    }
});

router.delete('/delete_budget/:budgetId', async (req, res) => {
    const {userId} = req.body;
    const {budgetId} = req.params;

    if (!userId || !budgetId) {
        return res.status(400).json({error: 'Missing fields'});
    }

    try {
        const budgetRef = db.collection('users').doc(userId).collection('budgets').doc(budgetId);
        await budgetRef.delete();

        res.status(200).json({message: 'Budget deleted successfully'});
    }catch (error) {
        console.error('Error Deleting Budget: ', error);
        return res.status(500).json({error: 'Failed to delete Budget'});
    }

});


module.exports = router; // Export the router