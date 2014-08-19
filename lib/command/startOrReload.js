
exports.name = 'startOrReload';
exports.usage = [
    '',
    '',
    '    ypm startOrReload <configFile> '
].join('\n');

exports.desc = 'start or Reload pm2 service';

var VError = require("verror"),
    _ = require("underscore"),
    shelljs = require("shelljs"),
    log = null;

exports.startOrReload = function(configFile, fn){

    var commander = null;

    if(yogPm.util.exists(configFile)){
        var config = yogPm.util.readJSON(configFile),
            name = config["name"] ? config["name"] : config[0]["name"],
            pm2Log = config["error_file"] ? config["error_file"] : null,
            yogLogDir = config["yogPm_log"] ? config["yogPm_log"] : null;

        log = yogPm.log.getCommandLogger(exports.name, name, yogLogDir);
        //pm2不会自动创建目录，文件不存在报错
        if(pm2Log){
            if(!yogPm.util.exists(pm2Log)){
                yogPm.util.write(pm2Log, "");
            }
        }

        //pm2的系统日志目录
        var pm2SysLog = shelljs.env["HOME"] + "/.pm2/";
        //修改目录权限，防止多个用户公用pm2时，没有权限修改log目录报错
        if(yogPm.util.exists(pm2SysLog)){
            shelljs.chmod("-R", 777, pm2SysLog);
        }else{
            yogPm.util.mkdir(pm2SysLog, 0777);
        }

        var prom = yogPm.pm2.q_connect()
            .then(function(){
                return yogPm.pm2.q_list();
            })
            .then(function(process_list){
                //服务的状态：online、error、offline
                var appLive = "offline";
                if(_.isEmpty(process_list)){
                    appLive = "offline";
                }else{
                    _.each(process_list, function(worker){
                        if(name == worker["name"]){
                            if(worker["pm2_env"]["status"] == "online"){
                                appLive = "online";
                            }else if(worker["pm2_env"]["status"] == "errored"){
                                appLive = "error";
                            }
                        }
                    });
                }
                return appLive;
            })
            .then(function(appLive){
                if(appLive == "offline"){
                    log.debug("app : " + name + " not live! start app!");
                    return yogPm.pm2.q_startJson(configFile, {}, null);
                }else if(appLive == "online"){
                    log.debug("app : " + name + " live! reload app!");
                    return yogPm.pm2.q_reload(name);
                }else if(appLive == "error"){
                    log.debug("app : " + name + " status error! restart app!");
                    return yogPm.pm2.q_restart(name);
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
