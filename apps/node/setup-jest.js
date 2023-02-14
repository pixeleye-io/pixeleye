const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config({ path: "../../.env" });

global.fetch = fetch;
