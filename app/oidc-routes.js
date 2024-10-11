// server
// app/routes.js

//coleman oidc
require('dotenv').config(); // Ensure this is at the top if you're using dotenv in local development

const passport = require('passport');
const OidcStrategy = require('passport-openidconnect').Strategy;
const jwt = require('jsonwebtoken');

const oidcConfig = {
    issuer: process.env.OIDC_ISSUER_URL,
    authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: process.env.OIDC_CALLBACK_URL,
    scope: 'openid profile'
};

passport.use(new OidcStrategy(oidcConfig, (issuer, sub, profile, accessToken, refreshToken, done) => {
    // Simulate a database call to find or create a user, this would be some PUA boi magic maybe
    findOrCreateUser({ issuer, sub, profile }, (err, user) => {
        if (err) {
            console.error('Error during findOrCreateUser:', err);
            return done(err);
        }
        return done(null, user);
    });
}));


const express = require("express")
const validator = require("validator")

const {
    getValidatedHost,
    getValidatedPort,
    maskSensitiveData,
    validateSshTerm
} = require("./utils")

const handleConnection = require("./connectionHandler")
const { createNamespacedDebug } = require("./logger")
const { ConfigError, handleError } = require("./errors")
const { HTTP } = require("./constants")

const debug = createNamespacedDebug("routes")
const router = express.Router()

// Middleware to ensure the user is authenticated via OIDC
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.originalUrl = req.originalUrl;
    //res.redirect('/oidc/login'); // Redirect to OIDC login if not authenticated
    passport.authenticate('openidconnect')(req, res, next);
}

router.get("/", ensureAuthenticated, (req, res) => {
    debug("router.get./: Accessed / route");
    handleConnection(req, res);
});

router.get('/login', (req, res, next) => {
    if (!req.session.originalUrl) {
        req.session.originalUrl = '/ssh';  // Set to a default path or homepage
    }
    passport.authenticate('openidconnect')(req, res, next);
});
router.get('/callback',
    passport.authenticate('openidconnect', {
        failureRedirect: '/oidc/login-failure',
        failureFlash: true // If you want to use flash messages to show errors
    }),
    (req, res) => {
        // Redirect to the original URL or default to some path if none is set
        const redirectUrl = req.session.originalUrl || '/ssh';
        res.redirect(redirectUrl);
        //delete req.session.originalUrl; // Clear the originalUrl from session
    }
);

router.get('/login-failure', (req, res) => {
    const errors = req.flash('error');
    console.log('Login Failed Errors:', errors);
    res.send('Login failed: ' + errors.join('; '));
});

module.exports = router
