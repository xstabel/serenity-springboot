#!/bin/bash
echo "Starting thread dump utility"

PID=`ps auxww | grep " java " | grep -v grep | awk '{print $2}'`

if [ -n "$PID" ]
then
   #### I have to validate if it has more than one line

   if [ `echo $PID | wc -l` -gt 1 ]
   then
      echo "There are several java processes"
      exit
   fi
   jstack -l $PID
else
   echo "No java process running"
fi
