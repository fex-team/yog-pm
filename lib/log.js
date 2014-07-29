
var path = require("path"),
    bunyan = require("bunyan");

/**
 * log的接口参考 ：https://github.com/trentm/node-bunyan
 */

exports.getCommandLogger = function(type, name, dir){
    var dir = dir ? dir + "/" : __dirname + "/../log/",
        logPath = dir + type + ".log",
        logPath = path.normalize(logPath);

    if(!yogPm.util.isDir(dir)){
        yogPm.util.mkdir(dir, 0777);
    }

    var log = bunyan.createLogger({
        name : name,
        streams : [
            {
                level : "warn",
                path : logPath,
                type : "file"
            },
            {
                level : "debug",
                stream : process.stdout
            }
        ]
    });
    return log;
}

exports.getLogger = function(){
    var name = "yog-pm";
    var log = bunyan.createLogger({
        name : name,
        streams : [
            {
                level : "debug",
                stream : process.stdout
            }
        ]
    });
    return log;
}