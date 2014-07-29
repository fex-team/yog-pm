
var exec = require("child_process").exec,
    Q = require("q"),
    VError = require("verror");

var log = spm2.log.getLogger();

function q_exec(command){
    var deferred = Q.defer();
    var childProcess = exec(command, function(error, stdout, stderr){
        if(error !== null){
            deferred.reject(error);
        }else{
            deferred.resolve(stdout);
        }
    });
    return deferred.promise;
}

exports.daemonLive = function(callback){
    exports.appLive("Daemon", callback);
}

exports.appLive = function(appName, callback){
    var commander = "ps ux | grep -c \"pm2: " + appName + "\"";
    q_exec(commander).then(function(data){
        var processNum = parseInt(data);
        if(processNum > 2){
            callback(true);
        }else{
            callback(false, appName + "pm not start");
        }
    }, function(error){
        callback(false, error);
    }).fail(function(error){
        var err = new VError(error, "[" + appName + "] appLive callback execute failed");
        log.error(err);
    });
}