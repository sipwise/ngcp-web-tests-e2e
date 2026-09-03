const { defineConfig } = require('cypress')

module.exports = defineConfig({
    ngcpConfig: {
        apiHost: 'https://ce-trunk.mgm.sipwise.com:1443',
        username: 'administrator',
        password: 'administrator'
    },
    numTestsKeptInMemory: 1,
    retries: 1,
    screenshotOnRunFailure: true,
    video: true,
    viewportHeight: 800,
    viewportWidth: 1280,
    watchForFileChanges: false,
    e2e: {
        setupNodeEvents (on, config) {
            return require('./cypress/plugins/index.js')(on, config)
        },
        baseUrl: 'https://ce-trunk.mgm.sipwise.com:1443',
        specPattern: 'cypress/e2e/ngcp-aui/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.js'
    }
})
