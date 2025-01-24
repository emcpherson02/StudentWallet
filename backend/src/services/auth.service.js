const { admin } = require('../config/firebase.config');
const { AuthenticationError, DatabaseError } = require('../utils/errors');
const {
    MESSAGE_INVALID_CREDENTIALS,
    MESSAGE_USER_EXISTS,
    MESSAGE_ERROR_OCCURRED
} = require('../utils/constants');

class AuthService {
    constructor(authModel) {
        this.authModel = authModel;
    }

    async loginUser(email, password) {
        try {
            const user = await this.authModel.findByEmail(email);

            if (!user || user.password !== password) {
                throw new AuthenticationError(MESSAGE_INVALID_CREDENTIALS);
            }

            const token = await admin.auth().createCustomToken(email);
            return { token, user };
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
            const existingUser = await this.authModel.findByEmail(email);
            if (existingUser) {
                throw new AuthenticationError(MESSAGE_USER_EXISTS);
            }

            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name
            });

            const user = await this.authModel.createUser(email, {
                name,
                dob,
                email,
                password
            });

            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            };
        } catch (error) {
            if (error instanceof AuthenticationError) throw error;
            throw new DatabaseError(MESSAGE_ERROR_OCCURRED);
        }
    }

    async googleAuth(profile) {
        try {
            return await this.authModel.createOrUpdateGoogleUser(profile);
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