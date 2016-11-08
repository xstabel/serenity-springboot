#!/bin/bash

### The time zone by default is Europe/Madrid
### If you want to get the full list of time zones availables in RHEL, you must execute this command timedatectl list-timezones
### In order to change the time zone you should confgiure an environment variable called TZ=Europe/Paris

if [ -n "$TZ" ]
then
   export TZ
else
   export TZ="Europe/Madrid"
fi

command=$1

shift 1

args=""

debug=""

for arg in $@ ; do
    if [ $arg == "-x" ]; then
      debug="-x"
    fi
    args="$args $arg"
done

case $command in
  info )
    source ./info $args ;;
  shell )
    source ./shell $args ;;
  start )
    source ./start $args ;;
  status )
    source ./status $args ;;
  test )
    source ./test $args ;;
  version)
    source ./version $args ;;
  heapdump)
    source ./heapdump $args ;;
  threaddump)
    source ./threaddump $args ;;

  * | help )
    source ./help ;;
esac
