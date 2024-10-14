// server
// app/app.js
require('dotenv').config();

const express = require("express")
const config = require("./config")
const socketHandler = require("./socket")
const sshRoutes = require("./routes")

var passport = require('passport');
var Strategy = require('passport-openidconnect');
flash = require('express-flash')
const jwt = require('jsonwebtoken');

const { applyMiddleware } = require("./middleware")
const { createServer, startServer } = require("./server")
const { configureSocketIO } = require("./io")
const { handleError, ConfigError } = require("./errors")
const { createNamespacedDebug } = require("./logger")
const { DEFAULTS, MESSAGES } = require("./constants")

const debug = createNamespacedDebug("app")

/**
 * Creates and configures the Express application
 * @returns {Object} An object containing the app and sessionMiddleware
 */
function createApp() {
  const app = express()

  try {
    // Resolve the correct path to the webssh2_client module
    const clientPath = DEFAULTS.WEBSSH2_CLIENT_PATH

    // Apply middleware
    const { sessionMiddleware } = applyMiddleware(app, config)

    app.use(passport.initialize());
    app.use(passport.session());

    app.use(flash());

    passport.use(new Strategy({
      issuer: process.env.OIDC_ISSUER_URL,
      authorizationURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/auth`,
      tokenURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/token`,
      userInfoURL: `${process.env.OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`,
      clientID: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      callbackURL: process.env.OIDC_CALLBACK_URL,
      scope: 'openid profile',
      passReqToCallback: true
    }, function verify(issuer, profile, cb) {
      console.log("verifying...");
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      console.log("Profile:", profile);
      findOrCreateUser({ issuer, profile }, (err, user) => {
        if (err) {
          console.error('Error during findOrCreateUser:', err);
          return cb(err);
        }
        return done(null, user);  // Ensure user object is correctly passed
      });
    })
    );

    passport.serializeUser((user, next) => {
      next(null, user);
    });

    passport.deserializeUser((obj, next) => {
      next(null, obj);
    });

    // Serve static files from the webssh2_client module with a custom prefix
    app.use("/ssh/assets", express.static(clientPath))

    // Use the SSH routes
    app.use("/ssh", ensureAuthenticated, sshRoutes)

    app.get('/callback',
      passport.authenticate('openidconnect', {
        failureMessage: true,
        failWithError: true,
        failureFlash: true,
        //successRedirect: req.session.returnTo
        //failureRedirect: '/login-failure'
      }), (req, res) => {
        // Redirect user back to the originally requested URL or default page
        const redirectUrl = req.session.returnTo || '/';
        //delete req.session.returnTo;  // Clear the saved URL to clean up the session
        res.redirect(redirectUrl);
      });

    app.get('/login-failure', (req, res) => {
      console.log('Login failed:', req.flash('error'));  // Ensure flash messages are logged or displayed
      res.send('Login Failure. Check logs for more details.');
    });

    return { app: app, sessionMiddleware: sessionMiddleware }
  } catch (err) {
    throw new ConfigError(
      `${MESSAGES.EXPRESS_APP_CONFIG_ERROR}: ${err.message}`
    )
  }
}

/**
 * Initializes and starts the server
 * @returns {Object} An object containing the server, io, and app instances
 */
function initializeServer() {
  try {
    const { app, sessionMiddleware } = createApp()
    const server = createServer(app)
    const io = configureSocketIO(server, sessionMiddleware, config)

    // Set up Socket.IO listeners
    socketHandler(io, config)

    // Start the server
    startServer(server, config)

    debug("Server initialized")

    return { server: server, io: io, app: app }
  } catch (err) {
    handleError(err)
    process.exit(1)
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("authenticated, move next...");
    next();
  } else {
    req.session.returnTo = req.originalUrl;
    console.log("not authenticated, trying...");
    passport.authenticate('openidconnect', {
      keepSessionInfo: true,
      failureMessage: true,
      failWithError: true,
      successRedirect: req.session.returnTo || '/ssh/'
    })(req, res, next);
  }
}

module.exports = { initializeServer: initializeServer, config: config }
