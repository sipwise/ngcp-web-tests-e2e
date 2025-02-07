const { defineConfig } = require('cypress')

module.exports = defineConfig({
    ngcpConfig: {
        apiHost: 'https://pro-trunk.mgm.sipwise.com:1443',
        username: 'administrator',
        password: 'administrator'
    },
    experimentalMemoryManagement: true,
    // Enable this if you run out of memory while running tests. You can specify the amount of tests that should be kept in RAM.
    // Keep in mind that you have to stop tests when an error occurs to look at test details.
    // Otherwise test details will be discarded after some time.
    // numTestsKeptInMemory: 2,
    retries: 1,
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
        baseUrl: 'https://pro-trunk.mgm.sipwise.com',
        specPattern: 'cypress/e2e/ngcp-csc-ui/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/ngcp-csc-ui'
    }
})
