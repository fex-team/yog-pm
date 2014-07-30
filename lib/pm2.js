
var pm2 = require("pm2"),
    Q = require("q"),
    _ = require("underscore");

module.exports = pm2;

_.map(pm2, function(fn, name){
    if(name.indexOf("_") < 0){
        var qName = "q_" + name;
        pm2[qName] = Q.denodeify(fn);
    }
});
