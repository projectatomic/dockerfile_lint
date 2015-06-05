FROM centos:centos7

MAINTAINER Aaron Weitekamp <aweiteka@redhat.com>

RUN echo -e "[epel]\nname=epel\nenabled=1\nbaseurl=https://dl.fedoraproject.org/pub/epel/7/x86_64/\ngpgcheck=0" > /etc/yum.repos.d/epel.repo

# we should be adding this locally then install
# but npm install /root/dockerfile_lint/ is failing
#ADD bin/dockerfile_lint \
#    config/base_rules.yaml \
#    config/config.js \
#    config/default_rules.yaml \
#    index.js \
#    LICENSE \
#    package.json \
#    README.md \
#    sample_rules.yaml \
#    /opt/dockerfile_lint/

# Note: won't need git with local install
RUN yum install -y --setopt=tsflags=nodocs npm git && \
    yum clean all

WORKDIR /opt
RUN npm install git+https://github.com/projectatomic/dockerfile_lint && \
    ln -s /opt/node_modules/dockerfile_lint/bin/dockerfile_lint /usr/bin/dockerfile_lint

# local install
#RUN npm install /opt/dockerfile_lint/
#    ln -s /opt/node_modules/dockerfile_lint/bin/dockerfile_lint /usr/bin/dockerfile_lint

WORKDIR /root/
LABEL RUN docker run -it --rm --privileged -v `pwd`:/root/ --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint -f Dockerfile

CMD /bin/bash
