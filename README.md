# yog-pm : The enhance for pm2

yog-pm是在pm2的基础上提供了几个增强命令，提高pm2的易用性和稳定性。

## 安装

```sh
$ npm install -g yog-pm
```

## 使用


###startOrReload ： 启动pm2服务

服务没有启动时start服务，服务已经启动则会reload。解决了多个用户同时运行pm2时，日志文件修改权限报错问题。

```sh
$ ypm startOrReload /home/wangcheng/demo/pm2-pro.json #利用pm2-pro.json文件启动引用
```

###memwatch ： 内存泄漏处理

检查pm2的子进程内存占用状况，对于超过内存设定值的子进程进行重启。

```sh
$ ypm memwatch /home/wangcheng/demo/pm2-pro.json
ypm memwatch -s 250  #设置检测阀值为250M
```

###daemon ： 服务守护功能

pm2提供了[startup](https://github.com/Unitech/pm2#startup-script)功能利用linux的systemd或者startup守护pm2服务
但需要root权限，大多数线上机器都无法使用此功能，提供daemon命令守护pm2服务。

```sh
$ ypm daemon /home/wangcheng/demo/pm2-pro.json
```

###init : 初始化pm2的配置文件

生成pm2的配置文件模版，支持dev和pro两种模式。
生成的只是一个模版，需要指定name和script。

```sh
$ ypm init -env dev #生成pm2配置文件
```

###yog-pm配置

* yogPm_log : 配置yog-pm运行生成的log的位置目录，每个命令独立一个log文件

### 配合crontab命令

memwatch、daemon等功能建议配合crontab一起使用。

    * * * * * /home/users/wangcheng/.jumbo/bin/node /home/users/wangcheng/wenku-node/base/node_modules/.bin/ypm daemon /home/users/wangcheng/wenku-node/base/pm2-pro.json
    * * * * * /home/users/wangcheng/.jumbo/bin/node /home/users/wangcheng/wenku-node/base/node_modules/.bin/ypm memwatch -s 52

针对我厂内部noah等提供了crontab功能，参考[这里](./doc/shell-crontab.md)如何使用。
