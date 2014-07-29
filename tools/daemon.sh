#!/bin/env bash

json=/home/work/repos/pm-demo/pm_demo.json
node_bin=/home/work/node/bin
yogPm_bin=/home/work/repos/pm-demo/node_modules/yog-pm/bin/yog-pm

result=`$node_bin $yogPm_bin daemon $json`

succ=`echo $result | grep -c -w "everything is ok"`
if [ $succ -gt 0 ]; then
    echo 0
else
    die=`echo $result | grep -c -e "exec error" -e "not exist"` 
    if [ $die -gt 0 ]; then
        echo -1;
    fi
fi




