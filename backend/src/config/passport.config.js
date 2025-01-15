const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { admin } = require('./firebase.config');

const initializePassport = (userService) => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3001/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const userData = await userService.handleGoogleAuth(profile);
            return done(null, userData);
        } catch (error) {
            return done(error, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    return passport;
};

module.exports = initializePassport;