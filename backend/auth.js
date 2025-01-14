const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const session = require('express-session');
const admin = require('firebase-admin');
const app = express();

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3001/auth/google/callback"
    },
    async function(accessToken, refreshToken, profile, done) {
        try {
            const db = admin.firestore();
            const userRef = db.collection('users').doc(profile.id);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                await userRef.set({
                    id: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    photoURL: profile.photos[0].value
                });
            }

            return done(null, profile);
        } catch (error) {
            return done(error, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;