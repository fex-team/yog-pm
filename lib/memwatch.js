exports.name = 'memwatch';
exports.usage = [
    '',
    '',
    '    fis-pm memwatch '
].join('\n');
exports.desc = 'watch pm2 workers memory usage, restart mem leak workers';

var log = null,
    VError = require("verror");

exports.registry = function(commander){

    commander
    	.option('-s, --size <int>', 'worker memory size', parseInt, 512);

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
        	memorySize = commander.size;

        var configFile = args[0];

       		startMonit(configFile, memorySize);

    });

    function startMonit(configFile, memorySize){
        if(spm2.util.exists(configFile)){
            var config = spm2.util.readJSON(configFile),
                name = config[0]["name"] || 'unknown-yog-app',
                logDir = config[0]["spm2_log"] ? config[0]["spm2_log"] : null;
            log = spm2.log.getCommandLogger(exports.name, name, logDir);

            spm2.pm2.daemonLive(function(result, reason){
                if(result){
                    log.debug("pm2 daemon live!");
                    var ipm2 = require("pm2-interface")(),
                        exitTimer = setTimeout(function(){
                            process.exit();
                        }, 3000);
                    ipm2.on("ready", function(){
                        clearTimeout(exitTimer);
                        ipm2.rpc.getMonitorData({}, function(err, dt){
                            if(err){
                                var error = VError(err, exports.name + " getMonitorData error");
                                log.error(err);
                            }else{
                                //todo : process.exit执行过早bug，使用q解决
                                var total = 0;
                                for(var i=0; i<dt.length; i++){
                                    var memory = dt[i]["monit"]["memory"] / (1024 * 1024);
                                    if(memory > memorySize){
                                        log.warn("child process memory [" + memory + "], restart!");
                                        ipm2.rpc.restartProcessId(dt[i]["pm_id"], function(err, dt){
                                            if(err){
                                                var error = new VError(err, "child process restart fail");
                                                log.error(error);
                                            }
                                        });
                                    }
                                }
                                process.exit();
                            }
                        });
                    });
                }else{
                    log.debug("pm2 daemon not run!");
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