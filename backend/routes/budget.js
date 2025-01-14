const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

//Add a budget
router.post('/add_budget', async (req, res) => {
    const {userId, category, amount, period, startDate, endDate} = req.body; //Extract required parameters from request body

    if (!userId || !category || !amount || !period) { // Validate required parameters
        return res.status(400).json({error: 'Missing fields'});
    }

    try{ // Create a new budget object
        const budget = {
            category,
            amount,
            period,
            spent: 0,
            startDate : startDate ? new Date(startDate) : null,
            endDate : endDate ? new Date(endDate) : null,
        };
        const userDocRef = db.collection('users').doc(userId); // Reference to the user document
        const budgetsRef = userDocRef.collection('budgets'); // Reference to the Budgets subcollection
        await budgetsRef.add(budget); // Add the budget to the Budgets subcollection

        return res.status(201).json({message: 'Budget added successfully'});
    } catch (error) {
        console.error('Error Adding Budget: ', error);
        return res.status(500).json({error: 'Failed to add Budget'});
    }
});

//Get all budgets
router.get('/get_budgets', async (req, res) => {
    const { userId } = req.query; // Extract the userId from the query parameters

    if (!userId) { // Validate the userId parameter
        return res.status(400).json({error: 'Missing fields'});
    }

    try {
        const budgetSnapshot = await db.collection('users').doc(userId).collection('budgets').get(); // Fetch all budgets from the Budgets subcollection
        const budgets = budgetSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); // Map the budgets to an array of objects


        res.status(200).json({budgets}); // Respond with the budgets array
    } catch (error) {
        console.error('Error Getting Budgets: ', error);
        return res.status(500).json({error: 'Failed to get Budgets'});
    }
});

//Update a budget
router.put('/update_budget/:budgetId', async (req, res) => {
    const { userId, category, amount, period, spent, startDate, endDate } = req.body; // Extract the userId from the request body
    const { budgetId } = req.params;

    if (!userId || !budgetId) { // Validate the request
        res.status(400).json({error: 'Missing fields'});
    }

    try { // Construct the dynamic updates object
        const budgetUpdates = {
            ...(category && {category}),
            ...(amount && {amount}),
            ...(period && {period}),
            ...(spent && {spent}),
            ...(startDate && {startDate: new Date(startDate)}),
            ...(endDate && {endDate: new Date(endDate)}),
        };
        const budgetRef = db.collection('users').doc(userId).collection('budgets').doc(budgetId);
        await budgetRef.update(budgetUpdates); // Perform the update

        res.status(200).json({message: 'Budget updated successfully'}); // Respond with a success message
    }catch (error) {
        console.error('Error Updating Budget: ', error);
        return res.status(500).json({error: 'Failed to update Budget'}); // Log and respond with an error message
    }
});

//Delete a budget
router.delete('/delete_budget/:budgetId', async (req, res) => {
    const {userId} = req.body; // Extract the userId from the request body
    const {budgetId} = req.params; // Extract the budgetId from the request parameters

    if (!userId || !budgetId) {
        return res.status(400).json({error: 'Missing fields'}); // Validate the request
    }

    try { // Reference to the budget document
        const budgetRef = db.collection('users').doc(userId).collection('budgets').doc(budgetId);
        await budgetRef.delete(); // Delete the budget

        res.status(200).json({message: 'Budget deleted successfully'});
    }catch (error) {
        console.error('Error Deleting Budget: ', error);
        return res.status(500).json({error: 'Failed to delete Budget'});
    }

});


module.exports = router; // Export the router