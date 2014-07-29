var VError = require("verror");

exports.name = 'daemon';
exports.usage = [
    '',
    '',
    '    fis-pm daemon <configFile>'
].join('\n');

exports.desc = 'watch pm2 daemon process, make sure pm2 work fine';

var exec = require("child_process").exec,
    log = null;

exports.registry = function(commander){

    commander
    	.option('-s, --size <int>', 'worker memory size', parseInt, 250);

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
            configFile = args[0];

        startDaemon(configFile);
    });

    function execCommand(commander){
        log.debug("start exec command " + commander);
        var child = exec(commander, function(error, stdout, stderr){
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

    function startDaemon(configFile){
        if(spm2.util.exists(configFile)){
            var config = spm2.util.readJSON(configFile),
                name = config[0]["name"] || 'unknown-yog-app',
                pm2Bin = config[0]["pm2_bin"] ? config[0]["pm2_bin"] + "/pm2" : "pm2",
                nodeBin = config[0]["node_bin"] ? config[0]["node_bin"] + "/node" : "node",
                logDir = config[0]["spm2_log"] ? config[0]["spm2_log"] : null;

            log = spm2.log.getCommandLogger(exports.name, name, logDir);

            var commander = null;

            spm2.pm2.daemonLive(function(result, reason){
                if(config[0]){
                    if(result){
                        log.debug("pm2 daemon live!");
                        var name = config[0]["name"];
                        spm2.pm2.appLive(name, function(result, reason){
                            if(!result){
                                log.debug("app : " + name + " not live!");
                                commander = nodeBin + " " + pm2Bin + " kill && " +   nodeBin + " " + pm2Bin + " start " + configFile;
                                execCommand(commander);
                            }else{
                                log.debug("everything is ok");
                            }
                        });
                    }else{
                        log.debug("pm2 daemon not run!");
                        commander = nodeBin + " " + pm2Bin + " start " + configFile;
                        execCommand(commander);
                    }

                }else{

                }
            });
        }else{
            log = spm2.log.getCommandLogger(exports.name, 'unknown-yog-app', null);
            var error = new VError(configFile + " not exist!");
            log.error(error);
            process.exit();
        }
	}

}