
var yogPm = require("../yog-pm.js");

var configFile = __dirname + "/pm2-dev.json";

yogPm.fn.startOrReload(configFile);