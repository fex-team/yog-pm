'use strict';

var yogPm = module.exports;

Object.defineProperty(global, 'yogPm', {
    enumerable : true,
    writable : false,
    value : yogPm
});

//先后顺序一定不要打乱
yogPm.util = require(__dirname + "/lib/util.js");
yogPm.log = require(__dirname + "/lib/log.js");
yogPm.pm2 = require(__dirname + "/lib/pm2.js");

//对外提供api接口
yogPm.fn = {};

require("fs").readdirSync(__dirname + "/lib/command").forEach(function(f){
    if(f.match(/\.js$/)){
        var command = require(__dirname + "/lib/command/" + f),
            name = f.replace(/\.js$/, "");
        yogPm.fn[name] = command[name];
    }
});

yogPm.cli = {};
yogPm.cli.name = "fis-pm";
yogPm.cli.commander = null;
yogPm.cli.info = yogPm.util.readJSON(__dirname + "/package.json");

yogPm.cli.help = function(){
    console.log(yogPm.cli.info);
}

yogPm.cli.version = function(){
    console.log(yogPm.cli.info.version);   
}

yogPm.cli.run = function(argv){
    var first = argv[2];

    if(first === '-h' || first === '--help'){
        yogPm.cli.help();
    } else if(first === '-v' || first === '--version') {
        yogPm.cli.version();
    } else if(first[0] === '-'){
        yogPm.cli.help();
    } else {
        var commander = yogPm.cli.commander = require('commander');
        var cmd = require('./lib/command/' + first + '.js');
        cmd.registry(
            commander
                .command(cmd.name || first)
                .usage(cmd.usage)
                .description(cmd.desc)
        );
        commander.parse(argv);
    }
};