# End-to-End tests for the WebUIs in the Sipwise VoIP Platform

We have separate test suits for admin-ui and csc-ui platform.
- ngcp-admin-ui tests are in the folder `cypress/e2e/ngcp-aui`
- ncgp-csc-ui tests are in the folder `cypress/e2e/ngcp-csc`

AUI and CSC tests can be run in different ways:
1. Using Cypress UI interface
2. Using the tdd headless mode
3. Using Docker


## 1. How to use Cypress UI Interface
### Setup - Create config files
Create the config files by running the below command.
This command will copy the current `cypress.csc.template.js` and `cypress.aui.template.js` content and save it as
`cypress.csc.config.js` and `cypress.aui.config.js` in your root folder

```bash
$ yarn run setup
```

### Setup - Update config files
* [Update CSC config file](docs/ngcp-csc.md#update-config-files)
* [Update AUI config file](docs/ngcp-aui.md#update-config-files)

### Start Cypress UI Interface
```bash
$ yarn run start:csc
$ yarn run start:aui
```


## 2. How to use TDD headless mode
### Setup - Create TDD config files
Create the tdd config files by running the below command.
This command will copy the current `cypress.tdd.csc.template.js` and `cypress.tdd.aui.template.js` content and save it as
`cypress.tdd.csc.config.js` and `cypress.tdd.aui.config.js` in your root folder

```bash
$ yarn run tdd:setup
```

### Setup - Update config TDD config files
* [Update CSC config file](docs/ngcp-csc.md#update-config-files)
* [Update AUI config file](docs/ngcp-aui.md#update-config-files)

### Start tests in TDD headless mode
```bash
$ yarn run tdd:csc
$ yarn run tdd:aui
```


## 3. How to run tests for CI
### Setup - Create config files
Create the config files by running the below command.
This command will copy the current `cypress.ci.csc.template.js` and `cypress.ci.aui.template.js` content and save it as
`cypress.ci.csc.config.js` and `cypress.ci.aui.config.js` in your root folder
```bash
$ yarn run ci:setup
```

### Running test in Docker
To run tests in already prepared docker image you just need to execute next command:
```bash
$ yarn run docker:run <tests parameters>
```
Where tests parameter are 4 in the following order:
1. application to test: aui or csc (mandatory)
2. app URL (mandatory, e.g. https://{ip})
3. api URL (mandatory, https://{ip}:1443)
4. group (optional, if no group is specified all test will be executed)

For example our parameters might be:
* "csc https://{ip} https://{ip}:1443 group2" -> execute tests in ngcp-csc/group2
* "aui https://{ip}:1443 https://{ip}:1443 group1" -> execute tests in ngcp-aui/group1
* "aui https://{ip}:1443 https://{ip}:1443" -> execute all tests in ngcp-aui

```bash
# CSC
$ yarn run docker:run csc https://{ip}/v2 https://{ip} group2
# OR AUI
$ yarn run docker:run aui https://{ip}:1443/v2 https://{ip}:1443 group2
```

In case you would like have you own local Docker image to apply custom version of Cypress you need to build a local Docker image.
For that please follow next steps:
1. Prepare desired version of "package.json"
2. Build your local Docker image with `$ yarn run docker:rebuild:local`
3. Run tests in Docker container with `$ yarn run docker:run:local <tests parameters>`

For example:
```bash
$ yarn run docker:rebuild:local
$ yarn run docker:run:local csc https://host.docker.internal:8080/v2 https://dev-web-trunk.mgm.sipwise.com group2
```

**Note**: if you would like to test CSC or AUI applications started locally you should pass `https://host.docker.internal:8080` instead of `https://localhost:8080` to the tests running script!

**Important**: if you test locally started application (CSC UI URL: `https://host.docker.internal:8080` or `https://localhost:8080`) you should change CSC user logins in your test's config template `cypress.ci.csc.template.json` to be with domain name, like so: `username@domain`. Otherwise, some tests might fail.
