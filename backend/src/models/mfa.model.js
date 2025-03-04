const { NotFoundError } = require('../utils/errors');

class MfaModel {
    constructor(db) {
        this.db = db;
        this.collection = 'users';
    }

    async enableMfa(userId, phoneNumber) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        // Store MFA settings in a subcollection
        await userRef.collection('mfaSettings').doc('settings').set({
            enabled: true,
            phoneNumber,
            lastUpdated: new Date().toISOString()
        });

        // Update user document with MFA flag
        await userRef.update({
            mfaEnabled: true
        });

        return { success: true };
    }

    async disableMfa(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        // Update MFA settings
        await userRef.collection('mfaSettings').doc('settings').set({
            enabled: false,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Update user document with MFA flag
        await userRef.update({
            mfaEnabled: false
        });

        return { success: true };
    }

    async getMfaSettings(userId) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        const settingsDoc = await userRef.collection('mfaSettings').doc('settings').get();

        if (!settingsDoc.exists) {
            return {
                enabled: false,
                phoneNumber: null
            };
        }

        return settingsDoc.data();
    }

    async storeMfaVerificationCode(userId, verificationCode, expiryTime) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            throw new NotFoundError('User not found');
        }

        await userRef.collection('mfaSettings').doc('verificationData').set({
            verificationCode,
            expiryTime,
            createdAt: new Date().toISOString()
        });

        return { success: true };
    }

    async verifyMfaCode(userId, code) {
        const userRef = this.db.collection(this.collection).doc(userId);
        const verificationDoc = await userRef.collection('mfaSettings').doc('verificationData').get();

        if (!verificationDoc.exists) {
            return { success: false, reason: 'No verification code found' };
        }

        const verificationData = verificationDoc.data();
        const currentTime = new Date();
        const expiryTime = new Date(verificationData.expiryTime);

        if (currentTime > expiryTime) {
            return { success: false, reason: 'Verification code expired' };
        }

        if (verificationData.verificationCode !== code) {
            return { success: false, reason: 'Invalid verification code' };
        }

        // Code is valid, delete it after successful verification
        await userRef.collection('mfaSettings').doc('verificationData').delete();

        return { success: true };
    }
}

module.exports = MfaModel;