'use strict';

var fs = require('fs'),
    pth = require('path'),
    crypto = require('crypto'),
    Url = require('url'),
    _exists = fs.existsSync || pth.existsSync,
    toString = Object.prototype.toString,
    iconv;

var IS_WIN = process.platform.indexOf('win') === 0;

var TEXT_FILE_EXTS = [
        'css', 'tpl', 'js', 'php',
        'txt', 'json', 'xml', 'htm',
        'text', 'xhtml', 'html', 'md',
        'conf', 'po', 'config', 'tmpl',
        'coffee', 'less', 'sass', 'jsp',
        'scss', 'manifest', 'bak', 'asp',
        'tmp', 'haml', 'jade'
    ],
    IMAGE_FILE_EXTS = [
        'svg', 'tif', 'tiff', 'wbmp',
        'png', 'bmp', 'fax', 'gif',
        'ico', 'jfif', 'jpe', 'jpeg',
        'jpg', 'woff', 'cur'
    ],
    MIME_MAP = {
        //text
        'css' : 'text/css',
        'tpl' : 'text/html',
        'js' : 'text/javascript',
        'php' : 'text/html',
        'asp' : 'text/html',
        'jsp' : 'text/jsp',
        'txt' : 'text/plain',
        'json' : 'application/json',
        'xml' : 'text/xml',
        'htm' : 'text/html',
        'text' : 'text/plain',
        'md' : 'text/plain',
        'xhtml' : 'text/html',
        'html' : 'text/html',
        'conf' : 'text/plain',
        'po' : 'text/plain',
        'config' : 'text/plain',
        'coffee' : 'text/javascript',
        'less' : 'text/css',
        'sass' : 'text/css',
        'manifest' : 'text/cache-manifest',
        //image
        'svg' : 'image/svg+xml',
        'tif' : 'image/tiff',
        'tiff' : 'image/tiff',
        'wbmp' : 'image/vnd.wap.wbmp',
        'png' : 'image/png',
        'bmp' : 'image/bmp',
        'fax' : 'image/fax',
        'gif' : 'image/gif',
        'ico' : 'image/x-icon',
        'jfif' : 'image/jpeg',
        'jpg' : 'image/jpeg',
        'jpe' : 'image/jpeg',
        'jpeg' : 'image/jpeg',
        'woff' : 'image/woff',
        'cur' : 'application/octet-stream'
    };

function getIconv(){
    if(!iconv){
        iconv = require('iconv-lite');
    }
    return iconv;
}

var _ = module.exports = function(path){
    var type = typeof path;
    if(arguments.length > 1) {
        path = Array.prototype.join.call(arguments, '/');
    } else if(type === 'string') {
        //do nothing for quickly determining.
    } else if(type === 'object') {
        path = Array.prototype.join.call(path, '/');
    } else if(type === 'undefined') {
        path = '';
    }
    if(path){
        path = pth.normalize(path.replace(/[\/\\]+/g, '/')).replace(/\\/g, '/');
        if(path !== '/'){
            path = path.replace(/\/$/, '');
        }
    }
    return path;
};

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

_.merge = function(source, target){
    if(_.is(source, 'Object') && _.is(target, 'Object')){
        _.map(target, function(key, value){
            source[key] = _.merge(source[key], value);
        });
    } else {
        source = target;
    }
    return source;
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

_.escapeShellCmd = function(str){
    return str.replace(/ /g, '"$&"');
};

_.escapeShellArg = function(cmd){
    return '"' + cmd + '"';
};

_.stringQuote = function(str, quotes, trim){
    var info = {
        origin : str,
        rest   : str,
        quote  : ''
    };
    if(trim !== false) {
        str = str.trim();
    }
    if(str){
        quotes = quotes || '\'"';
        var strLen = str.length - 1;
        for(var i = 0, len = quotes.length; i < len; i++){
            var c = quotes[i];
            if(str[0] === c && str[strLen] === c){
                info.quote = c;
                info.rest  = str.substring(1, strLen);
                break;
            }
        }
    }
    return info;
};

_.getMimeType = function(ext){
    if(ext[0] === '.'){
        ext = ext.substring(1);
    }
    return MIME_MAP[ext] || 'application/x-' + ext;
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

function getFileTypeReg(type){
    var map = [],
//        ext = fis.config.get('project.fileType.' + type);
        ext = '';
    if(type === 'text'){
        map = TEXT_FILE_EXTS;
    } else if(type === 'image'){
        map = IMAGE_FILE_EXTS;
    } else {
        fis.log.error('invalid file type [' + type + ']');
    }
    if(ext && ext.length){
        if(typeof ext === 'string'){
            ext = ext.split(/\s*,\s*/);
        }
        map = map.concat(ext);
    }
    map = map.join('|');
    return new RegExp('\\.(?:' + map + ')$', 'i');
}

_.isTextFile = function(path){
    return getFileTypeReg('text').test(path || '');
};

_.isImageFile = function(path){
    return getFileTypeReg('image').test(path || '');
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
        if(convert || _.isTextFile(path)){
            content = _.readBuffer(content);
        }
    } else {
        fis.log.error('unable to read file[' + path + ']: No such file or directory.');
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
        fis.log.error('unable to find [' + rPath + ']: No such file or No such file or directory.');
    }
    return list.sort();
};

_.del = function(rPath, include, exclude){
    var removedAll = true,
        path = _.realpath(rPath);
    if(path) {
        if(/^(?:\w:)?\/$/.test(path)){
            fis.log.error('unable to delete directory [' + rPath + '].');
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
        fis.log.error('unable to copy [' + rSource + ']: No such file or No such file or directory.');
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

_.query = function(str){
    var rest = str,
        pos = rest.indexOf('?'),
        query = '';
    if(pos > -1){
        query = rest.substring(pos);
        rest  = rest.substring(0, pos);
    }
    rest = rest.replace(/\\/g, '/');
    if(rest !== '/'){
        rest = rest.replace(/\/\.?$/, '');
    }
    return {
        origin : str,
        rest : rest,
        query : query
    };
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

_.parseUrl = function(url, opt){
    opt = opt || {};
    url = Url.parse(url);
    var ssl = url.protocol === 'https:';
    opt.host = opt.host
        || opt.hostname
        || ((ssl || url.protocol === 'http:') ? url.hostname : 'localhost');
    opt.port = opt.port || (url.port || (ssl ? 443 : 80));
    opt.path = opt.path || (url.pathname + (url.search ? url.search : ''));
    opt.method = opt.method || 'GET';
    opt.agent = opt.agent || false;
    return opt;
};

_.readJSON = function(path){
    var json = _.read(path),
        result = {};
    try {
        result = JSON.parse(json);
    } catch(e){
        fis.log.error('parse json file[' + path + '] fail, error [' + e.message + ']');
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

_.getTmpDir = function(){
    var list = ['LOCALAPPDATA', 'APPDATA', 'HOME'], tmp;
    for(var i = 0, len = list.length; i < len; i++){
        if(tmp = process.env[list[i]]){
            break;
        }
    }
    if(tmp){
        tmp += '/.fis-tmp/server';
        if(!fis.util.exists(tmp)){
            fis.util.mkdir(tmp);
        }
    } else {
        tmp = __dirname;
    }
    if(fis.util.isDir(tmp)){
        return fis.util.realpath(tmp);
    } else {
        fis.log.error('invalid temp directory [' + tmp + ']');
    }
};



_.normalize = _;

_.date_format = function (fmt) {
    var date = new Date();
    var o = {
        "M+": (date.getMonth() + 1), //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

/**
 * Checks if a value exists in an array
 * @param needle  The searched value.
 * @param {Array} haystack   The array
 * @param {Boolean} argStrict If the third parameter strict is set to TRUE then the in_array() function will also check the types of the needle in the haystack.
 * @returns {boolean}
 */
_.in_array = function(needle, haystack, argStrict) {
    var key = '',
        strict = !! argStrict;

    if (strict) {
        for (key in haystack) {
            if (haystack[key] === needle) {
                return true;
            }
        }
    } else {
        for (key in haystack) {
            if (haystack[key] == needle) {
                return true;
            }
        }
    }

    return false;
};

_.array_search = function(needle, haystack) {
    for(var i=0; i<haystack.length; i++){
        if(haystack[i] == needle){
            return i;
        }
    }
    return false;
};

_.removeByIndex = function(arr, index){
    arr.splice(index, 1);
    return arr;
};
