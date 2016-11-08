require_relative 'spec_helper'
require 'serverspec'
require 'docker-api'

# Module to setup the Serverspec docker context.
module DockerServerspecContext
  extend RSpec::SharedContext
   before(:all) do
     puts Dir.pwd
     @image = Docker::Image.build_from_dir('./image', { 'dockerfile' => 'Dockerfile.rhel7.2'})

     set :os, :family => 'redhat', :release => '7', :arch => 'x86_64'
     set :backend, :docker
     set :env, :JAVA_OPTS_EXT => '-Djava.security.egd=file:/dev/./urandom -Xmx512m'
     set :docker_image, @image.id
   end

end

RSpec.configure { |c| c.include DockerServerspecContext }