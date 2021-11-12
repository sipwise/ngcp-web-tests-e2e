# End-to-End tests for the WebUIs in the Sipwise VoIP Platform


### Special information related to each individual tests subproject

* [ngcp-csc-ui (Customer Self-Care WebUI)](docs/ngcp-csc-ui.md)
* [ngcp-admin-ui (Administration WebUI)](docs/ngcp-admin-ui.md)

## How to run tests for TDD

### Setup TDD
```bash
yarn run tdd:setup
```

### Run CSC tests

Configure `cypress.tdd.csc.json` according to your needs.

**Important**:
* the `baseUrl` should contain full URL to the application root like: `https://localhost:8080/v2`
* in case the `baseUrl` is pointing to `localhost` the `username` config parameter should be with domain name, like so: `username@domain`. Otherwise, some tests might fail.

To run tests in headless mode use next command
```bash
yarn run tdd:csc
```
In case you want to choose exact tests to run OR investigate tests errors visually you should run Cypress in UI mode
```bash
yarn run start:csc
```

### Run AUI tests

Configure `cypress.tdd.aui.json` according to your needs.

**Important**:
* the `baseUrl` should contain full URL to the application root like: `https://localhost:8081/v2`

To run tests in headless mode use next command
```bash
yarn run tdd:aui
```
In case you want to choose exact tests to run OR investigate tests errors visually you should run Cypress in UI mode
```bash
yarn run start:aui
```

## How to run tests for CI
### Running test in Docker
To run tests in already prepared docker image you just need to execute next command:
```bash
yarn run docker:run <parameters for the tests>
```
For example our parameters might be next:
* "csc \<CSC UI URL\>  \<CSC API URL\>"
* "aui \<AUI UI URL\>  \< AUI API URL\>"

```bash
yarn run docker:run csc https://dev-web-trunk.mgm.sipwise.com/v2 https://dev-web-trunk.mgm.sipwise.com
# OR
yarn run docker:run aui https://dev-web-trunk.mgm.sipwise.com:1443/v2 https://dev-web-trunk.mgm.sipwise.com:1443
```

In case you would like have you own local Docker image to apply custom version of Cypress you need to build a local Docker image.
For that please follow next steps:
1. Prepare desired version of "package.json"
2. Build your local Docker image with `yarn run docker:rebuild:local`
3. Run tests in Docker container with `yarn run docker:run:local <tests parameters>`

For example:
```bash
yarn run docker:rebuild:local
yarn run docker:run:local csc https://host.docker.internal:8080/v2 https://dev-web-trunk.mgm.sipwise.com
```

**Note**: if you would like to test CSC or AUI applications started locally you should pass `https://host.docker.internal:8080` instead of `https://localhost:8080` to the tests running script!

**Important**: if you test locally started application (CSC UI URL: `https://host.docker.internal:8080` or `https://localhost:8080`) you should change CSC user logins in your test's config template `cypress.ci.csc.template.json` to be with domain name, like so: `username@domain`. Otherwise, some tests might fail.
