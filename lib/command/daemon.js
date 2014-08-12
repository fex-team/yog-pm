var VError = require("verror");

exports.name = 'daemon';
exports.usage = [
    '',
    '',
    '    ypm daemon <configFile>'
].join('\n');

exports.desc = 'watch pm2 daemon process, make sure pm2 work fine';

var pm2 = require("pm2"),
    _ = require("underscore"),
    log = null;

exports.daemon = function(configFile){
    if(yogPm.util.exists(configFile)){
        var config = yogPm.util.readJSON(configFile),
            name = config["name"] ? config["name"] : config[0]["name"],
            logDir = config["yogPm_log"] ? config["yogPm_log"] : null;

        log = yogPm.log.getCommandLogger(exports.name, name, logDir);

        var prom = yogPm.pm2.q_connect()
            .then(function(){
                return yogPm.pm2.q_list();
            })
            .then(function(process_list){
                var appLive = false;
                if(_.isEmpty(process_list)){
                    appLive = false;
                }else{
                    _.each(process_list, function(worker){
                        if(name == worker["name"]){
                            appLive = true;
                        }
                    });
                }
                return appLive;
            })
            .then(function(appLive){
                if(appLive === false){
                    log.debug("app : " + name + " not live! start app!");
                    return yogPm.pm2.q_startJson(configFile, {}, null);
                }else{
                    log.debug("everything is ok");
                }
            })
            .then(function(){
                log.debug("daemon ok! disconnected!");
                yogPm.pm2.q_disconnect();
            }, function(error){
                log.error(error);
            })
            .fin(function(){
                process.exit(1);
            });
    }else{
        log = yogPm.log.getCommandLogger(exports.name, 'unknown-yog-app', null);
        var error = new VError(configFile + " not exist!");
        log.error(error);
        process.exit();
    }
}

exports.registry = function(commander){

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
            configFile = args[0];

        exports.daemon(configFile);
    });

}