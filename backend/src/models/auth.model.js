class AuthModel {
    constructor(db, admin) {
        this.db = db;
        this.admin = admin;
        this.collection = 'users';
    }

    async findByEmail(email) {
        const doc = await this.db.collection(this.collection).doc(email).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async createUser(email, userData) {
        await this.db.collection(this.collection).doc(email).set({
            ...userData,
            linkedBank: false,
            notificationsEnabled: false,
            createdAt: this.admin.firestore.FieldValue.serverTimestamp()
        });
        return { id: email, ...userData };
    }

    async createOrUpdateGoogleUser(profile) {
        const userRef = this.db.collection(this.collection).doc(profile.id);
        const userData = {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            photoURL: profile.photos[0].value,
            linkedBank: false,
            notificationsEnabled: false,
            createdAt: this.admin.firestore.FieldValue.serverTimestamp()  // Fixed this line
        };

        await userRef.set(userData, { merge: true });
        return userData;
    }
}

module.exports = AuthModel;