const { defineConfig } = require('cypress')

module.exports = defineConfig({
    ngcpConfig: {
        apiHost: 'https://ce-trunk.mgm.sipwise.com:1443',
        username: 'administrator',
        password: 'administrator'
    },
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 1,
    retries: 1,
    screenshotOnRunFailure: true,
    video: true,
    viewportHeight: 800,
    viewportWidth: 1280,
    watchForFileChanges: false,
    e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
        setupNodeEvents (on, config) {
            return require('./cypress/plugins/index.js')(on, config)
        },
        experimentalRunAllSpecs: true,
        baseUrl: 'https://ce-trunk.mgm.sipwise.com:1443',
        specPattern: 'cypress/e2e/ngcp-aui/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/ngcp-aui'
    }
})
