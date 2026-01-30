# DOCKER_NAME=ngcp-web-tests-e2e-trixie
FROM docker.mgm.sipwise.com/sipwise-trixie:latest

# Important! Update this no-op ENV variable when this Dockerfile
# is updated with the current date. It will force refresh of all
# of the base images and things like `apt-get update` won't be using
# old cached versions when the Dockerfile is built.
ENV REFRESHED_AT=2026-01-30

RUN apt-get update && \
    apt-get install --assume-yes --no-install-recommends \
        bzip2 \
        libdbus-glib-1-2 libgtk2.0-0 libgtk-3-0 libnotify-dev libgbm-dev libnss3 libxss1 libasound2 libxtst6 \
        nodejs \
        wget \
        yarnpkg \
        xauth \
        xvfb \
        xz-utils && \
    apt-get clean

# installing Chrome (136.0.7103.59)
RUN wget https://deb.sipwise.com/files/google-chrome-stable_136_amd64.deb && \
    apt install -y ./google-chrome-stable_136_amd64.deb  && \
    rm -f google-chrome-stable_current_amd64.deb

# installing firefox (lang=en_US) (138.0.1)
RUN wget https://deb.sipwise.com/files/firefox-138.0.1.tar.xz && \
    tar xvf firefox-138.0.1.tar.xz && \
    ln -s /home/selenium/firefox/firefox /usr/bin/firefox && \
    rm -f firefox-138.0.1.tar.xz

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
# % docker build --tag="ngcp-web-tests-e2e-trixie" -f ./t/Dockerfile .
#
# 1b. Use the existing docker image:
# % docker pull docker.mgm.sipwise.com/ngcp-web-tests-e2e-trixie
#
# 2. Run the container:
# CSC - run the following command from root folder of git repository to run a new container:
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.ci.csc.template.js:/code/cypress.template.js:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" docker.mgm.sipwise.com/ngcp-web-tests-e2e-trixie:latest bash
#
# AUI - run the following command from root folder of git repository to run a new container:
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.ci.aui.template.js:/code/cypress.template.js:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" docker.mgm.sipwise.com/ngcp-web-tests-e2e-trixie:latest bash
#
# NOTE: When you are working on Mac, add the --platform linux/amd64 flag  after "docker run" and it will create an amd64 image instead of an arm64 image.
#
# 3. Once you are inside the docker run:
#   ./run_web_e2e <parameters>
# The parameters are:
#    application_to_test="$1" ( mandatory: aui || csc)
#    ui_address="$2" (mandatory)
#    api_address="$3" (mandatory, eg. https://{ip}:1443)
#    group="$4" (optional: if no group is added all tests will be executed)
################################################################################
