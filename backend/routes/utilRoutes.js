const express = require('express');
const admin  = require('firebase-admin');
const router = express.Router();
const db = admin.firestore();

// Migration endpoint to add existing Firestore users to Firebase Auth
router.post('/migrate-users', async (req, res) => {
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


module.exports = router;