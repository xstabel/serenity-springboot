#!/bin/bash

echo "Starting heap dump utility"

#pushd "/usr/local/tomcat" > /dev/null


PID=`ps auxww | grep " java " | grep -v grep | awk '{print $2}'`

if [ -n "$PID" ]
then
   #### I have to validate if it has more than one line

   if [ `echo $PID | wc -l` -gt 1 ]
   then
      echo "There are several java processes"
      exit
   fi
   jmap -dump:format=b,file=/tmp/jvm.hprof $PID
   echo "Heap dump was create in /tmp/jvm.hprof"
else
   echo "No java process running"
fi
