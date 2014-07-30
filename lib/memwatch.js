exports.name = 'memwatch';
exports.usage = [
    '',
    '',
    '    ypm memwatch '
].join('\n');
exports.desc = 'watch pm2 workers memory usage, restart mem leak workers';

var log = null,
    VError = require("verror"),
    async = require("async"),
    pm2 = require("pm2"),
    _ = require("underscore");

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
        if(yogPm.util.exists(configFile)){
            var config = yogPm.util.readJSON(configFile),
                name = config["name"] ? config["name"] : config[0]["name"],
                logDir = config["yogPm_log"] ? config["yogPm_log"] : config[0]["yogPm_log"] ? config[0]["yogPm_log"] : null;

            log = yogPm.log.getCommandLogger(exports.name, name, logDir);

            pm2.connect(function(err){
                if(err){
                    log.error(err);
                }else{
                    log.debug("connect to pm2");
                    pm2.list(function(err, process_list){
                        if(err){
                            log.error(err);
                        }else{
                            if(!_.isEmpty(process_list)){
                                _.each(process_list, function(worker){
                                    var memory = worker["monit"]["memory"] / (1024 * 1024),
                                        leakWorkers = [];
                                    /**
                                     * todo : 采用promise完成
                                     *  1. 封装pm2.restart返回promise对象
                                     *  2. 逐个调用restart获取promise对象
                                     *  3. promise组合统一处理
                                     */
                                    if(memory > memorySize){
                                        leakWorkers.push(worker["pm_id"]);
                                    }
                                    if(leakWorkers.length > 0){
                                        async.each(leakWorkers, pm2.restart, function(err){
                                            if(err){
                                                var error = new VError(err, "child process restart fail");
                                                log.error(error);
                                            }
                                            pm2.disconnect(function(){
                                                log.debug("reload ok! disconnected!");
                                                process.exit(1);
                                            });
                                        });
                                    }
                                });
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