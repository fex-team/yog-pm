'use strict';

var fs = require('fs'),
    pth = require('path'),
    crypto = require('crypto'),
    Url = require('url'),
    _exists = fs.existsSync || pth.existsSync,
    toString = Object.prototype.toString,
    iconv;

var IS_WIN = process.platform.indexOf('win') === 0;

function getIconv(){
    if(!iconv){
        iconv = require('iconv-lite');
    }
    return iconv;
}

var _ = module.exports;

_.is = function(source, type){
    return toString.call(source) === '[object ' + type + ']';
};

_.map = function(obj, callback, merge){
    var index = 0;
    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            if(merge){
                callback[key] = obj[key];
            } else if(callback(key, obj[key], index++)) {
                break;
            }
        }
    }
};

_.pad = function(str, len, fill, pre){
    if(str.length < len){
        fill = (new Array(len)).join(fill || ' ');
        if(pre){
            str = (fill + str).substr(-len);
        } else {
            str = (str + fill).substring(0, len);
        }
    }
    return str;
};



_.clone = function(source) {
    var ret;
    switch(toString.call(source)){
        case '[object Object]':
            ret = {};
            _.map(source, function(k, v){
                ret[k] = _.clone(v);
            });
            break;
        case '[object Array]':
            ret = [];
            source.forEach(function(ele){
                ret.push(_.clone(ele));
            });
            break;
        default :
            ret = source;
    }
    return ret;
};

_.escapeReg = function(str){
    return str.replace(/[\.\\\+\*\?\[\^\]\$\(\){}=!<>\|:\/]/g, '\\$&');
};

_.exists = _exists;
_.fs = fs;

_.realpath = function(path){
    if(path && _exists(path)){
        path = fs.realpathSync(path);
        if(IS_WIN){
            path = path.replace(/\\/g, '/');
        }
        if(path !== '/'){
            path = path.replace(/\/$/, '');
        }
        return path;
    } else {
        return false;
    }
};

_.realpathSafe = function(path){
    return _.realpath(path) || _(path);
};

_.isAbsolute = function(path) {
    if (IS_WIN) {
        return /^[a-z]:/i.test(path);
    } else {
        if(path === '/'){
            return true;
        } else {
            var split = path.split('/');
            if(split[0] === '~'){
                return true;
            } else if(split[0] === '' && split[1]) {
                return _.isDir('/' + split[1] + '/' + split[2]);
            } else {
                return false;
            }
        }
    }
};

_.isFile = function(path){
    return _exists(path) && fs.statSync(path).isFile();
};

_.isDir = function(path){
    return _exists(path) && fs.statSync(path).isDirectory();
};

_.isWin = function(){
    return IS_WIN;
};

_.mkdir = function(path, mode){
    if (typeof mode === 'undefined') {
        //511 === 0777
        mode = 511 & (~process.umask());
    }
    if(_exists(path)) return;
    path.split('/').reduce(function(prev, next) {
        if(prev && !_exists(prev)) {
            fs.mkdirSync(prev, mode);
        }
        return prev + '/' + next;
    });
    if(!_exists(path)) {
        fs.mkdirSync(path, mode);
    }
};

_.toEncoding = function(str, encoding){
    return getIconv().toEncoding(String(str), encoding);
};

_.isUtf8 = function(bytes) {
    var i = 0;
    while(i < bytes.length) {
        if((// ASCII
            bytes[i] == 0x09 ||
            bytes[i] == 0x0A ||
            bytes[i] == 0x0D ||
            (0x20 <= bytes[i] && bytes[i] <= 0x7E)
        )) {
            i += 1;
            continue;
        }

        if((// non-overlong 2-byte
            (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
            (0x80 <= bytes[i+1] && bytes[i+1] <= 0xBF)
        )) {
            i += 2;
            continue;
        }

        if(
            (// excluding overlongs
                bytes[i] == 0xE0 &&
                (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
            ) || (// straight 3-byte
                ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
                bytes[i] == 0xEE ||
                bytes[i] == 0xEF) &&
                (0x80 <= bytes[i + 1] && bytes[i+1] <= 0xBF) &&
                (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
            ) || (// excluding surrogates
                bytes[i] == 0xED &&
                (0x80 <= bytes[i+1] && bytes[i+1] <= 0x9F) &&
                (0x80 <= bytes[i+2] && bytes[i+2] <= 0xBF)
            )
        ) {
            i += 3;
            continue;
        }

        if(
            (// planes 1-3
                bytes[i] == 0xF0 &&
                (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
            ) || (// planes 4-15
                (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
                (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
                (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
            ) || (// plane 16
                bytes[i] == 0xF4 &&
                (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
                (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
                (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
            )
        ) {
            i += 4;
            continue;
        }
        return false;
    }
    return true;
};

_.readBuffer = function(buffer){
    if(_.isUtf8(buffer)){
        buffer = buffer.toString('utf8');
        if (buffer.charCodeAt(0) === 0xFEFF) {
            buffer = buffer.substring(1);
        }
    } else {
        buffer = getIconv().decode(buffer, 'gbk');
    }
    return buffer;
};

_.read = function(path, convert){
    var content = false;
    if(_exists(path)){
        content = fs.readFileSync(path);
        if(convert){
            content = _.readBuffer(content);
        }
    } else {
        //fis.log.error('unable to read file[' + path + ']: No such file or directory.');
        throw new Error(e.message);
    }
    return content;
};

_.write = function(path, data, charset, append){
    if(!_exists(path)){
        _.mkdir(_.pathinfo(path).dirname);
    }
    if(charset){
        data = getIconv().encode(data, charset);
    }
    if(append) {
        fs.appendFileSync(path, data, null);
    } else {
        fs.writeFileSync(path, data, null);
    }
};

_.filter = function(str, include, exclude){
    if(typeof include === 'string'){
        include = _.glob(include);
    }
    if(typeof exclude === 'string'){
        exclude = _.glob(exclude);
    }
    return !((!!include && str.search(include) < 0) || (!!exclude && str.search(exclude) > -1));
};

_.find = function(rPath, include, exclude){
    var list = [],
        path = _.realpath(rPath);
    if(path){
        var stat = fs.statSync(path);
        if(stat.isDirectory()){
            fs.readdirSync(path).forEach(function(p){
                if(p[0] != '.') {
                    list = list.concat(_.find(path + '/' + p, include, exclude));
                }
            });
        } else if(stat.isFile() && _.filter(path, include, exclude)) {
            list.push(path);
        }
    } else {
        //fis.log.error('unable to find [' + rPath + ']: No such file or No such file or directory.');
        throw new Error(e.message);
    }
    return list.sort();
};

_.del = function(rPath, include, exclude){
    var removedAll = true,
        path = _.realpath(rPath);
    if(path) {
        if(/^(?:\w:)?\/$/.test(path)){
            //fis.log.error('unable to delete directory [' + rPath + '].');
            throw new Error(e.message);
        }
        var stat = fs.statSync(path);
        if(stat.isDirectory()){
            fs.readdirSync(path).forEach(function(name){
                if(name != '.' && name != '..') {
                    removedAll = _.del(path + '/' + name, include, exclude) && removedAll;
                }
            });
            if(removedAll) {
                fs.rmdirSync(path);
            }
        } else if(stat.isFile() && _.filter(path, include, exclude)) {
            fs.unlinkSync(path);
        } else {
            removedAll = false;
        }
    } else {
        //fis.log.error('unable to delete [' + rPath + ']: No such file or No such file or directory.');
        throw new Error(e.message);
    }
    return removedAll;
};

_.copy = function(rSource, target, include, exclude, uncover, move){
    var removedAll = true,
        source = _.realpath(rSource);
    target = _(target);
    if(source){
        var stat = fs.statSync(source);
        if(stat.isDirectory()){
            fs.readdirSync(source).forEach(function(name){
                if(name != '.' && name != '..') {
                    removedAll = _.copy(
                        source + '/' + name,
                        target + '/' + name,
                        include, exclude,
                        uncover, move
                    ) && removedAll;
                }
            });
            if(move && removedAll) {
                fs.rmdirSync(source);
            }
        } else if(stat.isFile() && _.filter(source, include, exclude)){
            if(uncover && _exists(target)){
                //uncover
                removedAll = false;
            } else {
                _.write(target, fs.readFileSync(source, null));
                if(move) {
                    fs.unlinkSync(source);
                }
            }
        } else {
            removedAll = false;
        }
    } else {
        //fis.log.error('unable to copy [' + rSource + ']: No such file or No such file or directory.');
        throw new Error(e.message);
    }
    return removedAll;
};

_.ext = function(str){
    var info = _.query(str), pos;
    str = info.fullname = info.rest;
    if((pos = str.lastIndexOf('/')) > -1){
        if(pos === 0){
            info.rest = info.dirname = '/';
        } else {
            info.dirname = str.substring(0, pos);
            info.rest = info.dirname + '/';
        }
        str = str.substring(pos + 1);
    } else {
        info.rest = info.dirname = '';
    }
    if((pos = str.lastIndexOf('.')) > -1){
        info.ext = str.substring(pos).toLowerCase();
        info.filename = str.substring(0, pos);
        info.basename = info.filename + info.ext;
    } else {
        info.basename = info.filename = str;
        info.ext = '';
    }
    info.rest += info.filename;
    return info;
};

_.pathinfo = function(path){
    //can not use _() method directly for the case _.pathinfo('a/').
    var type = typeof path;
    if(arguments.length > 1) {
        path = Array.prototype.join.call(arguments, '/');
    } else if(type === 'string') {
        //do nothing for quickly determining.
    } else if(type === 'object') {
        path = Array.prototype.join.call(path, '/');
    }
    return _.ext(path);
};

_.readJSON = function(path){
    var json = _.read(path),
        result = {};
    try {
        result = JSON.parse(json);
    } catch(e){
        //fis.log.error('parse json file[' + path + '] fail, error [' + e.message + ']');
        throw new Error(e.message);
    }
    return result;
};

_.glob = function(pattern, str){
    var sep = _.escapeReg('/');
    pattern = new RegExp('^' + sep + '?' +
        _.escapeReg(
                pattern
                    .replace(/\\/g, '/')
                    .replace(/^\//, '')
            )
            .replace(new RegExp(sep + '\\*\\*' + sep, 'g'), sep + '.*(?:' + sep + ')?')
            .replace(new RegExp(sep + '\\*\\*', 'g'), sep + '.*')
            .replace(/\\\*\\\*/g, '.*')
            .replace(/\\\*/g, '[^' + sep + ']*')
            .replace(/\\\?/g, '[^' + sep + ']') + '$',
        'i'
    );
    if(typeof str === 'string'){
        return pattern.test(str);
    } else {
        return pattern;
    }
};

_.normalize = _;
