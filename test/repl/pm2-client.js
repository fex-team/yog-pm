
var net = require("net");

client = net.connect(8855, "cp01-rdqa-dev160.cp01.baidu.com");

process.stdin.pipe(client);

client.pipe(process.stdout);

client.on("connect", function(data){
    process.stdin.setRawMode(true);
});

