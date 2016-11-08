#!/bin/bash

IMAGE_REGISTRY=${IMAGE_REGISTRY:-$1}
IMAGE_LIBRARY=${IMAGE_LIBRARY:-$2}
IMAGE_REPOSITORY=${IMAGE_REPOSITORY:-$3}
IMAGE_TAG=${IMAGE_TAG:-$4}
HTTP_PROXY=${HTTP_PROXY:-$5}

BUILD_ARG=""

if [ ! -z ${HTTP_PROXY} ]; then
  BUILD_ARG="${BUILD_ARG} --build-arg http_proxy=${HTTP_PROXY}"
  BUILD_ARG="${BUILD_ARG} --build-arg https_proxy=${HTTP_PROXY}"
fi

echo "Building javase docker image .."

docker build ${BUILD_ARG} -t ${IMAGE_REGISTRY}/${IMAGE_LIBRARY}/${IMAGE_REPOSITORY}:${IMAGE_TAG} -f ./image/Dockerfile.rhel7 ./image
