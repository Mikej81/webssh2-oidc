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

// Middleware to ensure the user is authenticated via OIDC
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.originalUrl = req.originalUrl;
  passport.authenticate('openidconnect')(req, res, next);
}

passport.use(new OidcStrategy(oidcConfig, (issuer, sub, profile, accessToken, refreshToken, done) => {
  // Use profile info to check if the user is registered in your db
  findOrCreateUser({ issuer, sub, profile }, (err, user) => {
    return done(err, user);
  });
}));
//coleman oidc

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

// eslint-disable-next-line consistent-return
function auth(req, res, next) {
  debug("auth: Basic Auth")
  const credentials = basicAuth(req)
  if (!credentials) {
    res.setHeader(HTTP.AUTHENTICATE, HTTP.REALM)
    return res.status(HTTP.UNAUTHORIZED).send(HTTP.AUTH_REQUIRED)
  }
  // Validate and sanitize credentials
  req.session.sshCredentials = {
    username: validator.escape(credentials.name),
    password: credentials.pass // We don't sanitize the password as it might contain special characters
  }
  req.session.usedBasicAuth = true // Set this flag when Basic Auth is used
  next()
}

router.get("/", ensureAuthenticated, (req, res) => {
  debug("router.get./: Accessed / route");
  handleConnection(req, res);
});

// Scenario 2: Auth required, uses HTTP Basic Auth
router.get("/host/:host", ensureAuthenticated, (req, res) => {
  debug(`router.get.host: /ssh/host/${req.params.host} route`);

  try {
    const host = getValidatedHost(req.params.host)
    const port = getValidatedPort(req.query.port)

    // Validate and sanitize sshterm parameter if it exists
    const sshterm = validateSshTerm(req.query.sshterm)

    req.session.sshCredentials = req.session.sshCredentials || {}
    req.session.sshCredentials.host = host
    req.session.sshCredentials.port = port
    if (req.query.sshterm) {
      req.session.sshCredentials.term = sshterm
    }
    req.session.usedBasicAuth = true

    // Sanitize and log the sshCredentials object
    const sanitizedCredentials = maskSensitiveData(
      JSON.parse(JSON.stringify(req.session.sshCredentials))
    )
    debug("/ssh/host/ Credentials: ", sanitizedCredentials)

    handleConnection(req, res, { host: host })
  } catch (err) {
    const error = new ConfigError(`Invalid configuration: ${err.message}`)
    handleError(error, res)
  }
})

// Clear credentials route
router.get("/clear-credentials", ensureAuthenticated, (req, res) => {
  req.session.sshCredentials = null;
  res.status(HTTP.OK).send(HTTP.CREDENTIALS_CLEARED);
});

router.get("/force-reconnect", ensureAuthenticated, (req, res) => {
  req.session.sshCredentials = null;
  res.status(HTTP.UNAUTHORIZED).send(HTTP.AUTH_REQUIRED);
});

module.exports = router
