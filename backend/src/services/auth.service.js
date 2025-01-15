const { admin } = require('../config/firebase.config');
const { AuthenticationError, DatabaseError } = require('../utils/errors');
const {
    MESSAGE_INVALID_CREDENTIALS,
    MESSAGE_USER_EXISTS,
    MESSAGE_ERROR_OCCURRED
} = require('../utils/constants');

class AuthService {
    constructor(db) {
        this.db = db;
        this.usersCollection = 'users';
    }

    async loginUser(email, password) {
        try {
            const userDoc = await this.db.collection(this.usersCollection).doc(email).get();

            if (!userDoc.exists || userDoc.data().password !== password) {
                throw new AuthenticationError(MESSAGE_INVALID_CREDENTIALS);
            }

            const token = await admin.auth().createCustomToken(email);
            return { token, user: userDoc.data() };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async registerUser(userData) {
        const { name, dob, email, password } = userData;

        try {
            const userDoc = await this.db.collection(this.usersCollection).doc(email).get();

            if (userDoc.exists) {
                throw new AuthenticationError(MESSAGE_USER_EXISTS);
            }

            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name
            });

            await this.db.collection(this.usersCollection).doc(email).set({
                name,
                dob,
                email,
                password,
                linkedBank: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            };
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async googleAuth(profile) {
        try {
            const userRef = this.db.collection(this.usersCollection).doc(profile.id);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                await userRef.set({
                    id: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    photoURL: profile.photos[0].value,
                    linkedBank: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            return profile;
        } catch (error) {
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async validateToken(token) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            throw new AuthenticationError('Invalid token');
        }
    }
}

module.exports = AuthService;