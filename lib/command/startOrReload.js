
exports.name = 'startOrReload';
exports.usage = [
    '',
    '',
    '    ypm startOrReload <configFile> '
].join('\n');

exports.desc = 'start or Reload pm2 service';

var VError = require("verror"),
    _ = require("underscore"),
    log = null;

exports.startOrReload = function(configFile, fn){

    var commander = null;

    if(yogPm.util.exists(configFile)){
        var config = yogPm.util.readJSON(configFile),
            name = config["name"] ? config["name"] : config[0]["name"],
            pm2Log = config["error_file"] ? config["error_file"] : null,
            yogLogDir = config["yogPm_log"] ? config["yogPm_log"] : null;

        log = yogPm.log.getCommandLogger(exports.name, name, yogLogDir);
        if(pm2Log){
            if(!yogPm.util.exists(pm2Log)){
                yogPm.util.write(pm2Log, "");
            }
        }

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
                    log.debug("app : " + name + " live! reload app!");
                    return yogPm.pm2.q_reload(name);
                }
            })
            .then(function(){
                var msg = "startOrReload ok! disconnected!";
                log.debug(msg);
                yogPm.pm2.q_disconnect();
                if(fn){
                    fn(null, msg);
                }
            }, function(error){
                log.error(error);
                if(fn){
                    fn(error);
                }
            })
            .fin(function(){
                process.exit(1);
            });
    }else{
        var error = new VError(configFile + " not exist!");
        log.error(error);
        process.exit();
    }
}

exports.registry = function(commander){

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
            configFile = args[0];
        exports.startOrReload(configFile);
    });

}
