// Coleman OIDC Mod
var express = require('express');
var passport = require('passport');
var OpenIDConnectStrategy = require('passport-openidconnect');

passport.use(new OpenIDConnectStrategy({
    issuer: process.env.OIDC_ISSUER_URL,
    authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: process.env.OIDC_CALLBACK_URL,
    scope: ['profile']
}, function verify(issuer, profile, cb) {
    return cb(null, profile);
}));

passport.serializeUser((user, next) => {
    next(null, user);
});

passport.deserializeUser((obj, next) => {
    next(null, obj);
});

var router = express.Router();

router.get('/login', passport.authenticate('openidconnect'));

router.get('/oauth2/redirect', passport.authenticate('openidconnect', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/fail'
}));

router.post('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;