var net = require("net"),
    pm2 = require("pm2"),
    repl = require("repl");
var server = net.createServer(function(socket){

	socket.on("close", function(){
	    console.log("client socket close");	
	});

	socket.on("error", function(){
	    console.log("client socket error");	
	});

	var r = repl.start({
	    prompt : "node via stdin> ",
	    input : socket,
	    output : socket,
	    terminal : true,
	    userGlobal : true
	});

	r.on("exit", function(){
	    console.log("exit event from repl");		
	    process.exit();
	});

	r.context.pm2 = pm2;
});

server.listen(8855);

