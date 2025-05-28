#!/bin/bash

set -e

readonly DOCKER_GLOBAL_IMAGE_NAME='docker.mgm.sipwise.com/ngcp-web-tests-e2e-bookworm:latest'
readonly DOCKER_LOCAL_IMAGE_NAME='ngcp-web-tests-e2e-bookworm:latest'

echo "Running Cypress test headless in Docker"

if [ $# -eq 0 ] || { [ $# -eq 1 ] && [ "$1" = "local" ]; }; then
  echo "Error: configuration parameters are missing. " >&2
  echo "    Parameters format: '[local] <app URL> <API URL> <group> (where group is optional)' " >&2
  echo "    Example: 'local https://host.docker.internal:8080 https://dev-web-trunk.mgm.sipwise.com' group2" >&2
  exit 1
fi

if [ "$1" = "local" ]; then
  shift
  DOCKER_IMAGE_NAME="${DOCKER_LOCAL_IMAGE_NAME}"
  echo "Using local docker image: ${DOCKER_IMAGE_NAME}"
else
  DOCKER_IMAGE_NAME="${DOCKER_GLOBAL_IMAGE_NAME}"
  echo "Pulling docker image: ${DOCKER_IMAGE_NAME}"
  docker pull "${DOCKER_IMAGE_NAME}"
fi

export MSYS_NO_PATHCONV=1    # might be used to solve automatic path transformation in Git Bash console on Windows platform
                              # try to use "/$PWD..." instead of "$(pwd)..." with Git Bash on Win

ARGS=( "$@" )

RESULTS_FOLDER="${PWD}/docker_results"
mkdir -p "${RESULTS_FOLDER}"
touch "${RESULTS_FOLDER}/console.log"
mkdir -p "${PWD}/cypress/screenshots" "${PWD}/cypress/videos" # we need it to keep "cypress" folder in RO mounting mode

application_to_test="$1"
config_file_name="cypress.ci.${application_to_test}.template.js"

docker run --rm -i -t \
  -v "/${PWD}/cypress:/code/cypress:ro" \
  -v "/${PWD}/package.json:/code/package.json:ro" \
  -v "/${PWD}/${config_file_name}:/code/cypress.template.js:ro" \
  -v "/${PWD}/t/run_web_e2e:/code/run_web_e2e:ro" \
  -v "/${RESULTS_FOLDER}/screenshots:/code/cypress/screenshots:rw" \
  -v "/${RESULTS_FOLDER}/videos:/code/cypress/videos:rw" \
  --entrypoint "/bin/bash" \
  "${DOCKER_IMAGE_NAME}" ./run_web_e2e "${ARGS[@]}" \
       2>&1 | tee "${RESULTS_FOLDER}/console.log"

# Note: to read "console.log" file you could use "less -R docker_results/console.log"  command

exit "${PIPESTATUS[0]}"
