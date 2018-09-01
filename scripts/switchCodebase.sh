#!/bin/bash

GREEN_FOLDER=./../../Green/BPL-node
BLUE_FOLDER=./../../Blue/BPL-node
BLUE=./../BPLNode/Blue/BPL-node
DATE=`date '+%Y-%m-%d %H:%M:%S'`

######################################
# Function to write logs in log file #
######################################
function log(){
  MESSAGE=$2
  LOG_FILE=$3/logs/wbx.log
  echo "[$1] $DATE | $MESSAGE "  >> $LOG_FILE
}

##########################################
# Function to migrate from Blue to Green #
##########################################
function copyData(){
    config=$1
    genesis=$2
    port=$3
    log "inf" "Copying the $config and $genesis files to Directory" $4
    cp $config $5
    cp $genesis $5
    log "inf" "Stopping the Current running node process...." $4
    kill -9 $(lsof -t -i:$port)
    sleep 2
    forever stop app.js
    sleep 2
    log "inf" "Process killed" $4

    cd $5
    log "inf" "Starting the Node process in Directory" $4
    temp=$(forever start app.js -c $config -g $genesis)
    cd $currentDir
}


function main()
{
    CONFIG=$1
    GENESIS=$2
    PORT=$3
    log "inf" "Config File : $CONFIG" $PWD
    log "inf" "Genesis File: $2" $PWD
    log "inf" "PORT: $PORT " $PWD
    if [[ $PWD =~ 'Blue' ]]
        then
          copyData $CONFIG $GENESIS $PORT $PWD $GREEN_FOLDER
    elif [[ $PWD =~ 'Green' ]]
        then
          copyData $CONFIG $GENESIS $PORT $PWD $BLUE_FOLDER
    elif [[ $PWD =~ 'BPL-node' ]]
        then
          copyData $CONFIG $GENESIS $PORT $PWD $BLUE
    fi
}

main $1 $2 $3
