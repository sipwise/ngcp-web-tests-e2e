# End-to-End tests for the WebUIs in the Sipwise VoIP Platform


### Special information related to each individual tests subproject

* [ngcp-csc-ui (Customer Self-Care WebUI)](docs/ngcp-csc-ui.md)
* [ngcp-admin-ui (Administration WebUI)](docs/ngcp-admin-ui.md)
## How to run
### Running test in Docker
To run tests in already prepared docker image you just need to execute next command:
```bash
yarn run docker:run <parameters for the tests>
```
For example our parameters are "< CSC UI URL >  < CSC API URL >"

```bash
yarn run docker:run https://dev-web-trunk.mgm.sipwise.com/v2 https://dev-web-trunk.mgm.sipwise.com
```

In case you would like have you own local Docker image to apply custom version of Cypress you need to build a local Docker image.
For that please follow next steps:
1. Prepare desired version of "package.json"
2. Build your local Docker image with `yarn run docker:rebuild:local`
3. Run tests in Docker container with `yarn run docker:run:local <tests parameters>`

For example:
```bash
yarn run docker:rebuild:local
yarn run docker:run:local https://host.docker.internal:8080 https://dev-web-trunk.mgm.sipwise.com
```

Note: if you would like to test CSC or AUI applications started locally you should pass `https://host.docker.internal:8080` instead of `https://localhost:8080` to the tests running script!

Important: if you test locally started application (CSC UI URL: `https://host.docker.internal:8080` or `https://localhost:8080`) you should change CSC user logins in your test's config to be with domain name, like so: `username@domain`. Otherwise, some tests might fail.
