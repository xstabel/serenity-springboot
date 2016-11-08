#!/bin/bash

echo "========================================="
echo "Starting application"
echo "========================================="
env | sort

AVAIL_MEM=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
let AVAIL_MEM_MB=$AVAIL_MEM/1024/1024
mem_literal="$AVAIL_MEM_MB"m

if [ -n "$ARTIFACT_URL" ]
then
  file=`basename "$ARTIFACT_URL"`
  wget -O "/tmp/$file" "$ARTIFACT_URL"
  if [ $? -eq 0 ]
  then

    if [[ $ARTIFACT_URL = *.tgz* ]]
    then
       tar -xzvf /tmp/$file -C "$APP_HOME"
    fi
    if [[ $ARTIFACT_URL = *.zip* ]]
    then
       unzip  /tmp/$file  -d "$APP_HOME"
    fi
    if [[ $ARTIFACT_URL = *.jar* ]]
    then
       cp /tmp/$file "$APP_HOME"
    fi
	if [[ $ARTIFACT_URL = *.war* ]]
    then
       cp /tmp/$file "$APP_HOME"
    fi
  else
    echo "ERROR: while Downloading file from $ARTIFACT_URL"
    return 1
  fi
fi

#### If JAR_PATH is empty I have to find a JAR in $APP_HOME

if [ -z "$JAR_PATH" ]
then
   JAR_PATH=`find $APP_HOME -name "*.jar" -o -name "*.war" | head -1`
fi

if [ -z "$JAR_PATH" ]
then
   JAR_PATH="/spring-boot-base-app-0.0.1-SNAPSHOT.jar"
fi

#### if you want to add extra JVM options,, you have to use the env variable JAVA_EXT_OPTS

exec java $JAVA_OPTS_EXT -jar "$JAR_PATH" $JAVA_PARAMETERS
