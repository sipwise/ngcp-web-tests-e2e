/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
    // `on` is used to hook into various events Cypress emits
    // `config` is the resolved Cypress config

    // Note: developers browsers might have different UI language setting so let's force that setting to English for better tests stability
    on('before:browser:launch', function setBrowserAcceptLanguage (browser, launchOptions) {
        const DEFAULT_ACCEPT_LANGUAGES = 'en,en-US'

        if (browser.family === 'chromium' && browser.name !== 'electron') {
            launchOptions.preferences.default.intl = {
                accept_languages: DEFAULT_ACCEPT_LANGUAGES,
                selected_languages: DEFAULT_ACCEPT_LANGUAGES
            }
            return launchOptions
        }

        if (browser.family === 'firefox') {
            launchOptions.preferences['intl.accept_languages'] = DEFAULT_ACCEPT_LANGUAGES
            return launchOptions
        }
    })
}
