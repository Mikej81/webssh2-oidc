// Coleman OIDC Mod
const express = require('express');
const validator = require("validator")

var passport = require('passport');

var parser = require("body-parser")

var KeyCloakStrategy = require('passport-keycloak-oauth2-oidc').Strategy;

const handleConnection = require("./connectionHandler")
const { createNamespacedDebug } = require("./logger")
const { ConfigError, handleError } = require("./errors")
const { HTTP } = require("./constants")

const debug = createNamespacedDebug("oidc")
const router = express.Router()

// passport.use(new OidcStrategy({
//   issuer: process.env.OIDC_ISSUER_URL,
//   authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
//   tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
//   userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
//   clientID: process.env.OIDC_CLIENT_ID,
//   clientSecret: process.env.OIDC_CLIENT_SECRET,
//   callbackURL: process.env.OIDC_CALLBACK_URL,
//   scope: 'openid email',
//   passReqToCallback: true
// }, function verify(issuer, email, cb) {
//   console.log("Verifying...");
//   console.log("Access Token:", accessToken);
//   console.log("Refresh Token:", refreshToken);
//   console.log("Email:", email);
//   findOrCreateUser({ issuer, profile }, (err, user) => {
//     if (err) {
//       console.error('Error during findOrCreateUser:', err);
//       return cb(err);
//     }
//     return done(null, user);  // Ensure user object is correctly passed
//   });
// })
// );

passport.use(new KeyCloakStrategy({
    issuer: process.env.OIDC_ISSUER_URL,
    authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    realm: process.env.OIDC_REALM,
    publicClient: 'false',
    sslRequired: 'external',
    authServerURL: process.env.OIDC_BASE_URL,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: process.env.OIDC_CALLBACK_URL,
    scope: "openid profile email",
    //passReqToCallback: true
}, (accessToken, refreshToken, profile, done) => {
    //console.log("Access Token:", accessToken);
    //console.log("Refresh Token:", refreshToken);
    //console.log("oidc ", oidc);
    //console.log("Profile:", profile);
    //console.log("Email: ", profile.email);

    done(null, profile);
})
);

passport.serializeUser(function (user, cb) {
    console.log("[serialize]");
    console.log(`id: ${user.id}, username: ${user.username}, name: ${user.name}, email: ${user.email}`);
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name, email: user.email });
    });
});

passport.deserializeUser(function (user, cb) {
    console.log("[deserialize]", user);
    process.nextTick(function () {
        return cb(null, user);
    });
});

router.get('/login', passport.authenticate('keycloak'));

router.get('/callback', function (req, res, next) {
    console.log("[Callback Start]");
    //console.log("Session content:", req.session);  // Debug: Check session content
    next();
}, passport.authenticate('keycloak', {
    successReturnToOrRedirect: '/ssh/',
    failureRedirect: '/login-failure'
}));

router.post('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;