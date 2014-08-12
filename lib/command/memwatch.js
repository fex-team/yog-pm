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
    Q = require("q"),
    _ = require("underscore");

exports.memwatch = function(configFile, memorySize){
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
                var leakWorkers = [];
                _.each(process_list, function(worker){
                    var memory = worker["monit"]["memory"] / (1024 * 1024);
                    if(memory > memorySize){
                        leakWorkers.push(worker["pm_id"]);
                    }
                });
                return leakWorkers;
            })
            .then(function(leakWorkers){
                if(leakWorkers.length > 0){
                    return Q.all(leakWorkers.map(function(worker){
                        return yogPm.pm2.q_restart(worker);
                    }));
                }
            })
            .then(function(){
                log.debug("reload ok! disconnected!");
                return yogPm.pm2.q_disconnect();
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

    commander
    	.option('-s, --size <int>', 'worker memory size', parseInt, 512);

    commander.action(function(){
        var args = Array.prototype.slice.call(arguments),
        	memorySize = commander.size;

        var configFile = args[0];

        exports.memwatch(configFile, memorySize);

    });

}