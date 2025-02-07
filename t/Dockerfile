# DOCKER_NAME=ngcp-web-tests-e2e-bookworm
FROM docker.mgm.sipwise.com/sipwise-bookworm:latest

# Important! Update this no-op ENV variable when this Dockerfile
# is updated with the current date. It will force refresh of all
# of the base images and things like `apt-get update` won't be using
# old cached versions when the Dockerfile is built.
ENV REFRESHED_AT=2024-10-09

RUN apt-get update && \
    apt-get install --assume-yes --no-install-recommends \
        bzip2 \
        nodejs \
        yarnpkg \
        libdbus-glib-1-2 libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libgbm-dev libnss3 libxss1 libasound2 libxtst6 \
        wget \
        xauth \
        xvfb && \
    apt-get clean

# installing Chrome (127.0.6533.88)
RUN wget https://deb.sipwise.com/files/google-chrome-stable_127_amd64.deb && \
    apt install -y ./google-chrome-stable_127_amd64.deb  && \
    rm -f google-chrome-stable_127_amd64.deb

# installing firefox (lang=en_US) (128.0.2)
RUN wget https://deb.sipwise.com/files/firefox-128.0.2.tar.bz2 && \
    tar xvf firefox-128.0.2.tar.bz2 && \
    ln -s /home/selenium/firefox/firefox /usr/bin/firefox && \
    rm -f firefox-128.0.2.tar.bz2

WORKDIR /code
ADD package.json /code/
ADD yarn.lock /code/
RUN yarnpkg install
RUN yarnpkg cypress install -f && \
    yarnpkg cypress verify


RUN echo "./run_web_e2e" >/root/.bash_history

################################################################################
# Instructions for usage
# ------------------------------------------------------------------------------  
# to run the tests, you need to follow 3 STEPS:
#
# Go to 1a if you want to build the base image from scratch or
# Go to 1b if you want to use the existing docker image.
#
# 1a. Build the base image from scratch
# % docker build --tag="ngcp-web-tests-e2e-bookworm" -f ./t/Dockerfile .
#
# 1b. Use the existing docker image:
# % docker pull docker.mgm.sipwise.com/ngcp-web-tests-e2e-bookworm
#
# 2. Run the container:
# CSC - run the following command from root folder of git repository to run a new container:
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.ci.csc.template.js:/code/cypress.template.js:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" docker.mgm.sipwise.com/ngcp-web-tests-e2e-bookworm:latest bash
#
# AUI - run the following command from root folder of git repository to run a new container:
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.ci.aui.template.js:/code/cypress.template.js:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" docker.mgm.sipwise.com/ngcp-web-tests-e2e-bookworm:latest bash
#
# NOTE: When you are working on Mac, add the --platform linux/amd64 flag  after "docker run" and it will create an amd64 image instead of an arm64 image.
#
# 3. Once you are inside the docker run:
#   ./run_web_e2e <parameters>
# The parameters are:
#    application_to_test="$1" ( aui || csc)
#    ui_address="$2" (include :1443 if you are testing aui)
#    api_address="$3" (include :1443 if you are testing aui)
################################################################################
