// server
// app/middleware.js

const createDebug = require("debug")
const session = require("express-session")
var cookieSession = require('cookie-session');
const bodyParser = require("body-parser")

const debug = createDebug("webssh2:middleware")
const { HTTP } = require("./constants")

/**
 * Creates and configures session middleware
 * @param {Object} config - The configuration object
 * @returns {Function} The session middleware
 */
function createSessionMiddleware(config) {
  return session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    name: config.session.name,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Ensure secure is true in production for HTTPS
      domain: process.env.COOKIE_DOMAIN, // Set the cookie domain to the highest level domain shared by both services
      path: '/',
      httpOnly: true,
      sameSite: 'None', // Can be 'strict' for more stringent CSRF protection
      maxAge: 3600000
    }
  })
}

/**
 * Creates body parser middleware
 * @returns {Function[]} Array of body parser middleware
 */
function createBodyParserMiddleware() {
  return [bodyParser.urlencoded({ extended: true }), bodyParser.json()]
}

/**
 * Creates cookie-setting middleware
 * @returns {Function} The cookie-setting middleware
 */
function createCookieMiddleware() {
  return (req, res, next) => {
    if (req.session.sshCredentials) {
      const cookieData = {
        host: req.session.sshCredentials.host,
        port: req.session.sshCredentials.port
      }
      res.cookie(HTTP.COOKIE, JSON.stringify(cookieData), {
        httpOnly: false,
        path: HTTP.PATH,
        sameSite: HTTP.SAMESITE
      })
    }
    next()
  }
}

/**
 * Applies all middleware to the Express app
 * @param {express.Application} app - The Express application
 * @param {Object} config - The configuration object
 * @returns {Object} An object containing the session middleware
 */
function applyMiddleware(app, config) {
  const sessionMiddleware = createSessionMiddleware(config)
  app.use(sessionMiddleware)

  app.use(createBodyParserMiddleware())
  app.use(createCookieMiddleware())

  debug("applyMiddleware")

  return { sessionMiddleware }
}

module.exports = {
  applyMiddleware,
  createSessionMiddleware,
  createBodyParserMiddleware,
  createCookieMiddleware
}
