# Docker image for SpringBoot Microservice

This image is based on Apline 3.x, contains the OpenJDK 1.8. This image is designed for Spring Boot but it could be used for any java daemon process.
The image exposes the port 8080 and the java process is executed by the "java" user.

### How to use image

The image contains a control.sh script, this script has several operations.

#### Help

docker run --rm -ti java-serenity:latest help
```
========================================
USAGE: /control.sh COMMAND [args]
  Command list:
    - info      : execute info for java options
    - shell     : execute shell scripts
    - start     : execute start scripts
    - status    : execute status scripts
    - threaddump  : Thread dump is created in system out
    - heapdump    : Heap dump file is created in /tmp/jvm.hprof
========================================
```

#### Environment Variables

JAVA_OPTS_EXT

Use this variable to add new parameters o properties to the java runtime process.
```
docker run -e JAVA_OPTS_EXT="-Djava.security.egd=file:/dev/./urandom -Xmx160m -XX:NativeMemoryTracking=summary" -d -p 8080:8080 java-serenity:1.0 start
```

In this example we configure the initial heap size to 256MB also we add a java property called "app.title".

APP_HOME=/opt/app

This is where we have to deploy our SpringBoot application and dependant files such as X509v3 certificates, private keys etc.

JAR_PATH

By default the start script get the first JAR file found in /opt/app, with this variable we can specify the application JAR file.

ARTIFACT_URL

This docker image is able to download an artifact from any https/http web server, the articaft can be jar/zip/tgz.

It is possible to package differents kind of files using tgz/zip artifact, at least one of them must be a jar file, tgz/zip
packaging is useful to package certificates, configuration files, java security policies etc.
The package tgz/zip is deplyecin the /opt/app directory.


### Memory considerations when running inside Openshift
http://trustmeiamadeveloper.com/2016/03/18/where-is-my-memory-java/
https://github.com/cloudfoundry/java-buildpack/blob/master/docs/jre-open_jdk_jre.md#memory


**Note**: Despite of this, if you set memory parameters in JVM_OPTIONS will be added after precalculated parameters: **your params rule over precalculated ones**.
### How yo activate Wily Agent for monitoring

The wily Agent is activated via environments variables, in this section we will describe every variable that we can use for wily activation.

APP_NAME

Using this variable we can configure agent/process name.
> NOTE: We recommend to inject OpenShift's metadada inside the container and use the application name, using this information will be very easy to group or indentify the container in the Wily Introscope console.

## Time Zone
By default this image uses the time zone "Europe/Madrid", if you want to change the default time zone, you should specify the environment variable TZ.
