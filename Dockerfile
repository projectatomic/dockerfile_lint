FROM centos:centos7

LABEL maintainer "Aaron Weitekamp <aweiteka@redhat.com> Lindani Phiri <lphiri@redhat.com>"

RUN echo -e "[epel]\nname=epel\nenabled=1\nbaseurl=https://dl.fedoraproject.org/pub/epel/7/x86_64/\ngpgcheck=0" > /etc/yum.repos.d/epel.repo

RUN yum install -y --setopt=tsflags=nodocs npm && \
    yum clean all

WORKDIR /opt/dockerfile_lint
ADD . .
RUN npm install && \
    ln -s /opt/dockerfile_lint/bin/dockerfile_lint /usr/bin/dockerfile_lint

RUN mkdir /sample_rules  && \
    cp sample_rules/basic_rules_atomic.yaml  sample_rules/basic_rules.yaml  sample_rules/label_rules.yaml  \
       sample_rules/openshift.yaml  sample_rules/osbs.yaml  sample_rules/recommended_label_rules.yaml \
       sample_rules/default_rules.yaml /sample_rules


WORKDIR /root/
LABEL RUN docker run -it --rm --privileged -v `pwd`:/root/ -v /var/run/docker.sock:/var/run/docker.sock --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint

CMD /bin/bash
