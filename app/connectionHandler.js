// server
// app/connectionHandler.js

const fs = require("fs")
const path = require("path")
const { createNamespacedDebug } = require("./logger")
const { HTTP, MESSAGES, DEFAULTS } = require("./constants")
const { modifyHtml } = require("./utils")

const debug = createNamespacedDebug("connectionHandler")

/**
 * Handle reading the file and processing the response.
 * @param {string} filePath - The path to the HTML file.
 * @param {Object} config - The configuration object to inject into the HTML.
 * @param {Object} res - The Express response object.
 */
function handleFileRead(filePath, config, res) {
  // eslint-disable-next-line consistent-return
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(HTTP.INTERNAL_SERVER_ERROR)
        .send(MESSAGES.CLIENT_FILE_ERROR)
    }

    const modifiedHtml = modifyHtml(data, config)
    res.send(modifiedHtml)
  })
}

/**
 * Convert the username and password into a Basic Auth header.
 * @param {string} username - The username for Basic Auth.
 * @param {string} password - The password for Basic Auth.
 * @returns {string} - The Basic Auth header value.
 */
function getBasicAuthHeader(username, password) {
  const credentials = `${username}:${password}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

/**
 * Handle the connection request and send the modified client HTML.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
function handleConnection(req, res) {
  debug("Handling connection req.path:", req.path)

  const clientPath = path.resolve(
    __dirname,
    "..",
    "node_modules",
    "webssh2_client",
    "client",
    "public"
  )

  // Retrieve the credentials from the session
  const { username, password } = req.session.sshCredentials || {};

  if (!username || !password) {
    return res.status(401).send("Unauthorized: Missing SSH credentials");
  }

  // Create the Basic Auth header
  const basicAuthHeader = getBasicAuthHeader(username, password);


  const tempConfig = {
    socket: {
      url: `${req.protocol}://${req.get("host")}`,
      path: "/ssh/socket.io",
      authHeader: basicAuthHeader,
    },
    autoConnect: req.path.startsWith("/host/") // Automatically connect if path starts with /host/
  }

  const filePath = path.join(clientPath, DEFAULTS.CLIENT_FILE)
  handleFileRead(filePath, tempConfig, res)
}

module.exports = handleConnection
