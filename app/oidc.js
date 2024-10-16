// Coleman OIDC Mod
const express = require("express");

var passport = require('passport');

var KeyCloakStrategy = require('passport-keycloak-oauth2-oidc').Strategy;

const { createNamespacedDebug } = require("./logger")
const { HTTP } = require("./constants")

const debug = createNamespacedDebug("oidc")
const router = express.Router()

passport.use(new KeyCloakStrategy({
    issuer: process.env.OIDC_ISSUER_URL,
    authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    realm: process.env.OIDC_REALM,
    publicClient: process.env.OIDC_PUBLIC_CLIENT,
    sslRequired: "external",
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
    debug("profile: ", profile);

    done(null, profile);
})
);

passport.serializeUser(function (user, cb) {
    debug(`[serialize] id: ${user.id}, username: ${user.username}, name: ${user.name}, email: ${user.email}`);
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name, email: user.email, websshpass: user._json.websshpass });
    });
});

passport.deserializeUser(function (user, cb) {
    //console.log("[deserialize]", user);
    process.nextTick(function () {
        return cb(null, user);
    });
});

router.get('/login', passport.authenticate('keycloak'));

router.get('/callback', function (req, res, next) {
    passport.authenticate('keycloak', function (err, user, info) {
        if (err) {
            return next(err);  // Handle errors
        }
        if (!user) {
            return res.redirect('/login-failure');  // If no user is authenticated
        }
        const returnTo = req.session.returnTo;

        // Log the session to check if returnTo is available
        console.log("Session content:", req.session.returnTo);
        req.logIn(user, function (err) {
            if (err) {
                return next(err);  // Handle login error
            }
            // Redirect to the returnTo path or fallback to default
            console.log("Session content 2: ", returnTo);
            const redirectUrl = returnTo || req.session.returnTo;
            delete req.session.returnTo;  // Clean up session
            return res.redirect(redirectUrl);
        });
    })(req, res, next);
});


router.post('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;