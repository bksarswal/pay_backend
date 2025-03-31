const { StandardCheckoutClient, Env } = require("pg-sdk-node");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientVersion = 1;
const env = Env.SANDBOX; // Change to Env.PRODUCTION in live mode

const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

module.exports = client;