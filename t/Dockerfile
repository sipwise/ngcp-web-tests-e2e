# DOCKER_NAME=ngcp-web-tests-e2e-bullseye
FROM docker.mgm.sipwise.com/sipwise-bullseye:latest

# Important! Update this no-op ENV variable when this Dockerfile
# is updated with the current date. It will force refresh of all
# of the base images and things like `apt-get update` won't be using
# old cached versions when the Dockerfile is built.
ENV REFRESHED_AT 2022-03-17

RUN apt-get update && \
    apt-get install --assume-yes --no-install-recommends \
        nodejs \
        yarnpkg \
        libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libgbm-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb \
        && \
    apt-get clean

# installing Chrome
RUN wget https://deb.sipwise.com/files/google-chrome-stable_current_amd64.deb && \
    apt install -y ./google-chrome-stable_current_amd64.deb && \
    rm -f google-chrome-stable_current_amd64.deb

# installing Firefox
# TODO: add Firefox installation code

WORKDIR /code
ADD package.json /code/
ADD yarn.lock /code/
RUN yarnpkg install
RUN yarnpkg cypress install -f && \
    yarnpkg cypress verify


RUN echo "cd /code && ./run_web_e2e" >/root/.bash_history

################################################################################
# Instructions for usage
# ----------------------
# When you want to build the base image from scratch
# (jump to the next section if you don't want to build yourself!):
#
# NOTE: run the following command from root folder of git repository to build docker image locally and run the container:
# % docker build --tag="ngcp-web-tests-e2e-bullseye" -f ./t/Dockerfile .
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.template.json:/code/cypress.template.json:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" ngcp-web-tests-e2e-bullseye:latest bash
#
# Use the existing docker image:
# % docker pull docker.mgm.sipwise.com/ngcp-web-tests-e2e-bullseye
#
# NOTE: run the following command from root folder of git repository to run a new container:
# % docker run --rm -i -t -v "/${PWD}/cypress:/code/cypress:rw" -v "/${PWD}/package.json:/code/package.json:ro" -v "/${PWD}/cypress.template.json:/code/cypress.template.json:ro" -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" docker.mgm.sipwise.com/ngcp-web-tests-e2e-bullseye:latest bash
#
# Inside docker:
#   cd /code && ./run_web_e2e <parameters>
################################################################################
