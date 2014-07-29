
exports.name = 'startOrReload';
exports.usage = [
    '',
    '',
    '    fis-pm startOrReload <configFile> '
].join('\n');

exports.desc = 'start or Reload pm2 service';

var exec = require("child_process").exec,
    VError = require("verror"),
    log = null;

exports.registry = function(commander){

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
            configFile = args[0];
        startOrReload(configFile);
    });

    function execCommand(command){
        log.debug("start exec command " + command);
        var child = exec(command, function(error, stdout, stderr){
            if(error !== null){
                var err = new VError(error, exports.name + " exec error");
                log.error("exec error : " + error);
            }
            if(stdout !== null){
                log.debug("exec result : " + stdout);
            }

            process.exit();
        });
        child.on("exit", function(num, signal){
            process.exit();
        });
        child.on("close", function(num, signal){
            process.exit();
        });
        child.on("disconnect", function(num, signal){
            process.exit();
        });
        child.on("error", function(num, signal){
            process.exit();
        });
    }

    function startOrReload(configFile){

        var commander = null;

        //todo : 修改支持非数据json格局格式写法
        if(spm2.util.exists(configFile)){
            var config = spm2.util.readJSON(configFile),
                name = config[0]["name"],
                pm2Bin = config[0]["pm2_bin"] ? config[0]["pm2_bin"] + "/pm2" : "pm2",
                nodeBin = config[0]["node_bin"] ? config[0]["node_bin"] + "/node" : "node",
                logDir = config[0]["spm2_log"] ? config[0]["spm2_log"] : null;

            log = spm2.log.getCommandLogger(exports.name, name, logDir);

            spm2.pm2.daemonLive(function(result, reason){
                if(config[0]){
                    if(result){
                        var name = config[0]["name"];
                        log.debug("pm2 daemon live!");
                        spm2.pm2.appLive(name, function(result, reason){
                            if(result){
                                log.debug("app : " + name + " live!");
                                commander = nodeBin + " " + pm2Bin + " reload " + name;
                            }else{
                                log.debug("app : " + name + " not live!");
                                //需要先kill，否则如果上次启动error会导致这次也无法启动
                                commander = nodeBin + " " + pm2Bin + " kill && " +   nodeBin + " " + pm2Bin + " start " + configFile;
                            }
                            execCommand(commander);
                        });
                    }else{
                        log.debug("pm2 daemon not live!");
                        commander = nodeBin + " " + pm2Bin + " start " + configFile;
                        execCommand(commander);
                    }
                }else{
                    log.error(configFile + " parse wrong!");
                }

            });
        }else{
            var error = new VError(configFile + " not exist!");
            log.error(error);
            process.exit();
        }
    }

}
