
var pm2 = require("../node_modules/pm2");


pm2.connect(function(){
    pm2.list(function(err, process_list){
        for(var i=0; i<process_list.length; i++){
            console.log(process_list[i]["pm2_env"]["status"]);
        }
    });
});