#!/bin/env bash

json=/home/work/repos/pm-demo/pm_demo.json
node_bin=/home/work/node/bin
yogPm_bin=/home/work/repos/pm-demo/node_modules/yog-pm/bin/yog-pm

result=`$node_bin $yogPm_bin memwatch $json -s 52`
die=`echo $result | grep -c -e "not exist" -e "getMonitorData error"`
if [ $die -gt 0 ];then
    #出错，返回-1
    echo '-1'
else
    mem_over=`echo $result | grep -c -e "child process restart fail"`
    if [ $mem_over -gt 0 ]; then
        #内存超出，重启失败，返回-2
        echo -2;
    else
        #成功，返回 0
        echo 0;
    fi
fi




