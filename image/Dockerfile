FROM frolvlad/alpine-oraclejdk8:slim

#ADD local.repo /etc/yum.repos.d/
#ADD application.jar /
ADD spring-boot-base-app-0.0.1-SNAPSHOT.jar /

ENV JAVA_VERSION 1.8.0
ENV GID 20000
ENV UID 20000

ENV APP_HOME /opt/app
ENV IMAGE_SCRIPTS_HOME /opt/serenity


RUN mkdir -p $APP_HOME && \
   	mkdir $IMAGE_SCRIPTS_HOME && \
    mkdir -p $IMAGE_SCRIPTS_HOME/bin

COPY Dockerfile $IMAGE_SCRIPTS_HOME/Dockerfile
#COPY java-buildpack-memory-calculator $IMAGE_SCRIPTS_HOME/bin/java-buildpack-memory-calculator

#RUN yum clean all && yum -y install \
#       java-$JAVA_VERSION-openjdk-devel \

RUN apk add --no-cache --update-cache bash
RUN addgroup -g $GID java && adduser -s /bin/bash -D -G java java

ADD scripts $IMAGE_SCRIPTS_HOME

RUN chown -R java:java $APP_HOME && \
    chown -R java:java $IMAGE_SCRIPTS_HOME

EXPOSE 8080
#######################################################################
##### We have to expose image metada as label and ENV
#######################################################################
LABEL imageowner="Products and Services" \
      description="Java 8 runtime for Spring boot microservices" \
      components="java8"

ENV imageowner="Products and Services" \
    description="Java 8 runtime for Spring boot microservices" \
    components="java8"

#USER java
WORKDIR $IMAGE_SCRIPTS_HOME

#ENTRYPOINT [ "java","-Djava.security.egd=file:/dev/./urandom","-jar","/application.jar"]
ENTRYPOINT [ "./control.sh" ]
CMD [ "start" ]
