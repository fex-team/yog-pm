
var pm2 = require("../node_modules/pm2");
var shelljs = require("../node_modules/shelljs");

shelljs.config.fatal = true;

console.log(shelljs.env);

var pm2Dir = shelljs.env["HOME"] + "/.pm2";

shelljs.chmod("-R", 777, pm2Dir);
