#!/bin/bash
#
# An init.d script for running a Node.js process as a service using Forever as
# the process monitor. For more configuration options associated with Forever,
# see: https://github.com/nodejitsu/forever

echo `date`

#
# exec-server              This shell script takes care of starting and stopping a Kaltura exec-server Service
#
# description: Kaltura exec-server

### BEGIN INIT INFO
# Provides:          kaltura-batch
# Required-Start:    $local_fs $remote_fs $network
# Required-Stop:     $local_fs $remote_fs $network
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# X-Interactive:     true
# Short-Description: Start/stop Kaltura exec-server
# Description:       Control the Kaltura exec-server.
### END INIT INFO
 
NAME="Kaltura execution-server"
NODE_PATH="/opt/kaltura/exec-server/node_modules"
APPLICATION_PATH="/opt/kaltura/exec-server/main.js"
PIDFILE="/opt/kaltura/exec-server/config/exec-server.pid"
LOGFILE="/opt/kaltura/log/kaltura_exec_server_forever.log"
MIN_UPTIME="5000"
SPIN_SLEEP_TIME="2000"
 
PATH=$NODE_BIN_DIR:$PATH
export NODE_PATH=$NODE_PATH
 
start() {
    echo "Starting $NAME"
    forever \
      --pidFile $PIDFILE \
      -a \
      -l $LOGFILE \
      --minUptime $MIN_UPTIME \
      --spinSleepTime $SPIN_SLEEP_TIME \
      start $APPLICATION_PATH 2>&1 > /dev/null &
    RETVAL=$?
}
 
stop() {
    if [ -f $PIDFILE ]; then
        echo "Shutting down $NAME"
        # Tell Forever to stop the process.
        forever stop $APPLICATION_PATH 2>&1 > /dev/null
        # Get rid of the pidfile, since Forever won't do that.
        rm -f $PIDFILE
        RETVAL=$?
    else
        echo "$NAME is not running."
        RETVAL=0
    fi
}
 
restart() {
    stop
    start
}
 
status() {
    echo `forever list` | grep -q "$APPLICATION_PATH"
    if [ "$?" -eq "0" ]; then
        echo "$NAME is running."
        RETVAL=0
    else
        echo "$NAME is not running."
        RETVAL=3
    fi
}

logRotated() {
        if [ -f $PIDFILE ]; then
                echo "Notify log rotate for $NAME."
                kill -USR1 `cat $PIDFILE`
                RETVAL=1
        else
                echo "$NAME is not running."
                RETVAL=0
        fi
}
 
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        restart
        ;;
 	logRotated)
        logRotated
        ;;

    *)
        echo "Usage: {start|stop|status|restart|logRotated}"
        exit 1
        ;;
esac
exit $RETVAL