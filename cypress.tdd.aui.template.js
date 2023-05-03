const { defineConfig } = require('cypress')

module.exports = defineConfig({
    ngcpConfig: {
        apiHost: 'https://pro-trunk.mgm.sipwise.com:1443',
        username: 'administrator',
        password: 'administrator'
    },
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
        baseUrl: 'https://pro-trunk.mgm.sipwise.com:1443',
        specPattern: 'cypress/e2e/ngcp-admin-ui/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/ngcp-admin-ui'
    }
})
