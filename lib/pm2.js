
var pm2 = require("pm2"),
    Q = require("q");

module.exports = pm2;

//todo : 自动将所有的函数封装为支持promise的
pm2.q_connect = function(){
    var deferred = Q.defer();
    pm2.connect(function(error){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve();
        }
    });
    return deferred.promise;
}

pm2.q_disconnect = function(){
    var deferred = Q.defer();
    pm2.disconnect(function(error, proc){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve(proc);
        }
    });
    return deferred.promise;
}


pm2.q_list = function(){
    var deferred = Q.defer();
    pm2.list(function(error, process_lists){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve(process_lists);
        }
    });
    return deferred.promise;
}

pm2.q_restart = function(id){
    var deferred = Q.defer();
    pm2.restart(id, function(error, proc){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve(proc);
        }
    });
    return deferred.promise;
}

pm2.q_startJson = function(file, config){
    var deferred = Q.defer();
    pm2.startJson(file, config, null, function(error, proc){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve(proc);
        }
    });
    return deferred.promise;
}

pm2.q_reload = function(name){
    var deferred = Q.defer();
    pm2.reload(name, function(error, proc){
        if(error){
            deferred.reject(error);
        }else{
            deferred.resolve(proc);
        }
    });
    return deferred.promise;
}
