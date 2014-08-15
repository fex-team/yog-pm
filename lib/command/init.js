
exports.name = 'init';
exports.usage = [
    '',
    '',
    '    ypm init '
].join('\n');
exports.desc = 'init a pm2 config file';

var log = null;


exports.registry = function(commander){

    commander
        .option("-e --env <String>", "config file type [dev|pro]");

    commander.action(function(){
        var configEnv = commander.env,
            configDir = __dirname + "/../../tools/",
            configDesDir = process.cwd() + "/",
            configDes = null,
            configSource = null,
            log = null;

        log = yogPm.log.getLogger();

        if(configEnv == "dev"){
            configSource = configDir + "pm2-dev.json";
            configDes = configDesDir + "pm2-dev.json";
        }else{
            configSource = configDir + "pm2-pro.json";
            configDes = configDesDir + "pm2-pro.json";
        }
        yogPm.util.copy(configSource, configDes);
        log.info("create pm2 config file [" + configDes + "]");

        //todo : 生成log目录
    });
}