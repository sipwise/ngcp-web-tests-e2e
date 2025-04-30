const { defineConfig } = require('cypress')

module.exports = defineConfig({
    ngcpConfig: {
        // apiHost always needs :1443 at the end
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
        setupNodeEvents (on, config) {
            return require('./cypress/plugins/index.js')(on, config)
        },
        experimentalRunAllSpecs: true,
        // For AUI tests, baseUrl NEEDS to have :1443 at the end
        baseUrl: 'https://pro-trunk.mgm.sipwise.com:1443',
        specPattern: 'cypress/e2e/ngcp-admin-ui/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/ngcp-admin-ui'
    }
})
