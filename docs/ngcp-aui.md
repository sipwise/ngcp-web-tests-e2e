# How to run ngcp-aui End-to-End tests

## Intro
This test suit is testing the application ngcp-aui

## Prerequisites in NGCP
None

## How to use Cypress UI Interface
- [Create config files](../README.md#Setup-create-config-files)
- [Update config files](#update-config-files)
- start Cypress interface with the below command:
```bash
$ yarn run start:aui
```

## How to run AUI tests in tdd headless mode
### Setup TDD
- [Create config files](../README.md#Setup-create-rdd-config-files)
- [Update config files](#update-config-file)
- To execute tests in headless mode use commands:
```bash
$ yarn run tdd:aui
$ yarn run tdd:aui --spec "cypress/e2e/ngcp-aui/admin.cy.js" // to run only one specific test
```


## How to run tests for CI
### Running test in Docker
To run tests in already prepared docker image you just need to execute next command:
```bash
$ yarn run docker:run <tests parameters>
```
Where tests parameter are 4 in the following order:
1. application to test: aui
2. app URL --> e.g. ` https://{ip}:1443`
3. api URL (making sure you add :1443 to the URL) -> https://{ip}:1443`
4. group (optional, if no group is specified all test will be executed) --> This refers to the sub-folder and will be used for the `--spec` flag. Available options are: group1 and group2


For example our parameters might be:
* "aui https://{ip}:1443 https://{ip}:1443 group2" -> execute tests in ngcp-aui/group2
* "aui https://{ip}:1443 https://{ip}:1443" -> execute all tests in ngcp-aui

```bash
# AUI
$ yarn run docker:run aui https://guest01-snail.lab.sipwise.com:1443/v2 https://guest01-snail.lab.sipwise.com:1443 group2
# or
$ yarn run docker:run aui https://guest01-snail.lab.sipwise.com:1443/v2 https://guest01-snail.lab.sipwise.com:1443
```
**Note "/v2" is added to direct to the NEW amin panel UI rather than the OLD UI. depending on your config.yml settings, you might not need to add it.**

In case you would like have you own local Docker image to apply custom version of Cypress you need to build a local Docker image.
For that please follow next steps:
1. Prepare desired version of "package.json"
2. Build your local Docker image with `yarn run docker:rebuild:local`
3. Run tests in Docker container with `yarn run docker:run:local <tests parameters>`

For example AUI:
```bash
$ yarn run docker:rebuild:local
$ yarn run docker:run:local aui https://host.docker.internal:8080/v2 https://dev-web-trunk.mgm.sipwise.com:1443 group2
```

**Note**: if you would like to test AUI applications started locally you should pass `https://host.docker.internal:8080` instead of `https://localhost:8080` to the tests running script!

**Important**: if you test locally started application (AUI UI URL: `https://host.docker.internal:8080` or `https://localhost:8080`) you should change AUI user logins in your test's config template `cypress.ci.aui.template.js` to be with domain name, like so: `username@domain`. Otherwise, some tests might fail.


## Update Config Files
```js
ngcpConfig: {
        apiHost: 'https://{ip}:1443', --> make sure you add :1443 at the end of your URL
        ...
    },
    
    e2e: {
        setupNodeEvents (on, config) {...},
        baseUrl: 'https://{ip}:1443', --> make sure you add :1443 at the end of your URL
        ...
    }
```
**Important**:
* the `baseUrl` should contain full URL to the application root like: `https://localhost:8080/v2`
* in case the `baseUrl` is pointing to `localhost` the `username` config parameter should be with domain name, like so: `username@domain`. Otherwise, some tests might fail.
