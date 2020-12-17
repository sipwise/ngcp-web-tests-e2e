// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (username, password) => {
    const log = Cypress.log({
        name: 'login',
        displayName: 'LOGIN',
        message: `🔒 Authenticating | ${username}`,
        autoEnd: false
    })
    const ngcpConfigCSC = Cypress.config('ngcpConfigCSC')
    const loginData = {
        username,
        password
    }
    const apiLoginURL = `${ngcpConfigCSC.apiHost}/login_jwt`

    return cy
        .request({
            method: 'POST',
            url: apiLoginURL,
            body: loginData,
            log: false
        })
        .then((response) => {
            const quasarFrameworkDataPrefix = '__q_strn|'
            localStorage.csc_jwt = quasarFrameworkDataPrefix + response.body.jwt
            localStorage.csc_subscriberId = quasarFrameworkDataPrefix + response.body.subscriber_id

            log.set({
                consoleProps () {
                    return {
                        apiURL: apiLoginURL,
                        username,
                        password,
                        jwt: response.body.jwt,
                        subscriberId: response.body.subscriber_id
                    }
                }
            })
            log.end()
        })
})
