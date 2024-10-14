// // server
// // app/routes.js

// //coleman oidc
// require('dotenv').config(); // Ensure this is at the top if you're using dotenv in local development

// const passport = require('passport');
// const flash = require('connect-flash');
// const OidcStrategy = require('passport-openidconnect').Strategy;
// const jwt = require('jsonwebtoken');

// const oidcConfig = {
//     issuer: process.env.OIDC_ISSUER_URL,
//     authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
//     tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
//     userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
//     clientID: process.env.OIDC_CLIENT_ID,
//     clientSecret: process.env.OIDC_CLIENT_SECRET,
//     callbackURL: process.env.OIDC_CALLBACK_URL,
//     scope: 'openid email'
// };

// passport.use(new OidcStrategy(oidcConfig, (issuer, sub, profile, accessToken, refreshToken, done) => {
//     findOrCreateUser({ issuer, sub, profile }, (err, user) => {
//         if (err) {
//             console.error('Error during findOrCreateUser:', err);
//             return done(err);
//         }
//         return done(null, user);
//     });
// }), (error, user, info) => {
//     if (error) {
//         console.log('Error obtaining access token:', error);
//         return done(error);
//     }
//     console.log("returned token")
// });


// const express = require("express")
// const validator = require("validator")

// const {
//     getValidatedHost,
//     getValidatedPort,
//     maskSensitiveData,
//     validateSshTerm
// } = require("./utils")

// const handleConnection = require("./connectionHandler")
// const { createNamespacedDebug } = require("./logger")
// const { ConfigError, handleError } = require("./errors")
// const { HTTP } = require("./constants")

// const debug = createNamespacedDebug("routes")
// const router = express.Router()

// // Middleware to ensure the user is authenticated via OIDC
// function ensureAuthenticated(req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     req.session.originalUrl = req.originalUrl;
//     //res.redirect('/oidc/login'); // Redirect to OIDC login if not authenticated
//     passport.authenticate('openidconnect', { failureMessage: true, failWithError: true }),
//         (req, res, next) => {
//             if (err) {
//                 console.error(err); // Log the error for debugging
//                 return res.status(403).json({ message: 'Forbidden' });
//             }
//         };
// }


// module.exports = router
