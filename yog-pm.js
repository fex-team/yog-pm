'use strict';

var spm2 = module.exports;

Object.defineProperty(global, 'spm2', {
    enumerable : true,
    writable : false,
    value : spm2
});

//先后顺序一定不要打乱
spm2.util = require(__dirname + "/lib/util.js");
spm2.log = require(__dirname + "/lib/log.js");
spm2.pm2 = require(__dirname + "/lib/pm2.js");


spm2.cli = {};
spm2.cli.name = "fis-pm";
spm2.cli.commander = null;
spm2.cli.info = spm2.util.readJSON(__dirname + "/package.json");

spm2.cli.help = function(){
    console.log(spm2.cli.info);
}

spm2.cli.version = function(){
    console.log(spm2.cli.info.version);   
}

spm2.cli.run = function(argv){
    var first = argv[2];

    if(first === '-h' || first === '--help'){
        spm2.cli.help();
    } else if(first === '-v' || first === '--version') {
        spm2.cli.version();
    } else if(first[0] === '-'){
        spm2.cli.help();
    } else {
        var commander = spm2.cli.commander = require('commander');
        var cmd = require('./lib/' + first + '.js');
        cmd.registry(
            commander
                .command(cmd.name || first)
                .usage(cmd.usage)
                .description(cmd.desc)
        );
        commander.parse(argv);
    }
};