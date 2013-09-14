#!/bin/bash
#export SDC_CLI_ACCOUNT=[use your account]
#export SDC_CLI_IDENTITY=[use your private key]
#export SDC_CLI_URL=https://api.micloud.tw
#export SDC_CLI_KEY_ID=[use your key id]

export machine=`sdc-createmachine --tag "group=web" --dataset sdc:sdc:nodejs:13.1.0 --package "S 1GB RAM (1CORE)" --script ./deploy.sh`

#echo Machine created: $machine 
#sleep 1
echo UUID: `sdc-listmachines | json [0].id`
echo Opennodes Web IP: http://`sdc-listmachines | json [0].primaryIp`:3000
