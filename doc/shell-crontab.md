
### crontab shell工具

> 可以配置crontab命令定期执行 daemon 和  memwatch 命令。提供定期执行的脚本。

1. tools/memwatch.sh 和 tools/daemon.sh

这两个脚本过滤了所有报错信息，返回数字。Copy两个脚本部署到项目目录，注意修改脚本顶部三个变量值，指定路径。

#### 需要修改的变量

1. json=/home/work/repos/pm-demo/pm_demo.json  ``指定yogPm配置文件路径``
2. node_bin=/home/work/.jumbo/bin/node   ``指定node可执行路径``
3. yogPm_bin=/home/work/repos/pm-demo/node_modules/yog-pm/bin/yog-pm    ``指定yog-pm 执行路径``

#### 返回值

* 程序出错返回 -1
* 程序执行正常返回 0
* memwatch 重启程序失败返回 -2

使用方式：

    * * * * * sh /home/work/repos/pm-demo/node_modules/yog-pm/tools/memwatch.sh
    * * * * * sh /home/work/repos/pm-demo/node_modules/yog-pm/tools/daemon.sh
