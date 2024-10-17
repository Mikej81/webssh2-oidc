// server
// app/app.js
require('dotenv').config();

var createError = require('http-errors');
var cookieParser = require('cookie-parser');

//var csrf = require('csurf');

const express = require("express")
const config = require("./config")
const socketHandler = require("./socket")
const sshRoutes = require("./routes");
const oidcRoutes = require("./oidc");

var passport = require('passport');

const { applyMiddleware } = require("./middleware")
const { createServer, startServer } = require("./server")
const { configureSocketIO } = require("./io")
const { handleError, ConfigError } = require("./errors")
const { createNamespacedDebug } = require("./logger")
const { DEFAULTS, MESSAGES } = require("./constants")
const { reset } = require('nodemon');

const debug = createNamespacedDebug("app")

/**
 * Creates and configures the Express application
 * @returns {Object} An object containing the app and sessionMiddleware
 */
function createApp() {
  const app = express()

  try {

    // Apply middleware
    const { sessionMiddleware } = applyMiddleware(app, config)

    // Example: Setting trust proxy if behind a reverse proxy (e.g., nginx)
    //app.set('trust proxy', true);  // trust proxy

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(sessionMiddleware);

    app.use(passport.initialize());
    app.use(passport.session());

    //app.use(csrf());

    app.use(passport.authenticate('session'));

    app.use(function (req, res, next) {
      var msgs = req.session.messages || [];
      res.locals.messages = msgs;
      res.locals.hasMessages = !!msgs.length;
      req.session.messages = [];
      next();
    });

    // app.use(function (req, res, next) {
    //   res.locals.csrfToken = req.csrfToken();
    //   next();
    // });

    // Resolve the correct path to the webssh2_client module
    const clientPath = DEFAULTS.WEBSSH2_CLIENT_PATH

    // app.use(function (req, res, next) {
    //   res.locals.authenticated = req.session.passport && req.session.passport.user;

    //   if (res.locals.authenticated) {
    //     res.locals.accounts = {};

    //     Object.keys(req.session.accounts).forEach(function (e) {
    //       res.locals.accounts[e] = req.session.accounts[e].public;
    //     });
    //   }

    //   res.locals.originalUrl = req.originalUrl;

    //   next();
    // });

    // Serve static files from the webssh2_client module with a custom prefix
    app.use("/ssh/assets", express.static(clientPath))
    // Use the SSH routes
    app.use("/ssh", sshRoutes)
    // Use the OIDC Routes
    app.use("/oidc", oidcRoutes)

    // catch 404 and forward to error handler
    // app.use(function (req, res, next) {
    //   next(createError(404));
    // });

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

module.exports = { initializeServer: initializeServer, config: config }
