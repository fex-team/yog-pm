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

exports.registry = function(commander){

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
            configFile = args[0];

        startDaemon(configFile);
    });

    function startDaemon(configFile){
        if(yogPm.util.exists(configFile)){
            var config = yogPm.util.readJSON(configFile),
                name = config["name"] ? config["name"] : config[0]["name"],
                logDir = config["yogPm_log"] ? config["yogPm_log"] : config[0]["yogPm_log"] ? config[0]["yogPm_log"] : null;

            log = yogPm.log.getCommandLogger(exports.name, name, logDir);

            var appLive = false;

            //todo : 错误处理导致程序结构过于复杂
            pm2.connect(function(err){
                if(err){
                    log.error(err);
                }else{
                    log.debug("connect to pm2");
                    pm2.list(function(err, process_list){
                        if(err){
                            log.error(err);
                        }else{
                            if(_.isEmpty(process_list)){
                                appLive = false;
                            }else{
                                _.each(process_list, function(worker){
                                    if(name == worker["name"]){
                                        appLive = true;
                                    }
                                });
                            }
                            if(appLive === false){
                                log.debug("app : " + name + " not live!");
                                pm2.startJson(configFile, {}, null, function(error, proc){
                                    if(error){
                                        log.error(error);
                                    }
                                    pm2.disconnect(function(){
                                        log.debug("start ok! disconnected!");
                                        process.exit(1);
                                    });
                                });
                            }else{
                                log.debug("everything is ok");
                                process.exit(1);
                            }
                        }
                    });
                }
            });
        }else{
            log = yogPm.log.getCommandLogger(exports.name, 'unknown-yog-app', null);
            var error = new VError(configFile + " not exist!");
            log.error(error);
            process.exit();
        }
	}

}