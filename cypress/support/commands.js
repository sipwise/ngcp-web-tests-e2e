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

Cypress.Commands.add('loginApi', (username, password) => {
    const debugging = false
    const log = Cypress.log({
        name: 'loginApi',
        displayName: 'LOGIN (API)',
        message: `🔒 Authenticating: ${username}`,
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
            log: debugging
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

Cypress.Commands.add('loginUI', (username, password) => {
    const debugging = false
    const log = Cypress.log({
        name: 'loginUI',
        displayName: 'LOGIN (UI)',
        message: `💻 🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    cy.intercept('POST', '**/login_jwt').as('loginRequest')
    cy.get('input:first', { log: debugging }).type(username, { log: debugging })
    cy.get('input:last', { log: debugging }).type(password, { log: debugging })
    cy.get('.q-btn:last', { log: debugging }).click({ log: debugging })
    cy.wait('@loginRequest', { log: debugging }).then(({ response }) => {
        log.set({
            consoleProps () {
                return {
                    username,
                    password,
                    jwt: response.body.jwt,
                    subscriberId: response.body.subscriber_id
                }
            }
        })
    })
    // Waiting for user data requesting \ initialization.
    // Note: Unfortunately we cannot fully relay on requests waiting because we might have different amount of requests
    //       according to the user type.
    //       So, to be sure that we are logged in we are waiting for an unique UI element of MainLayout
    cy.get('.q-drawer', { log: debugging }).should('to.be.visible', { log: debugging })

    log.end()
})

Cypress.Commands.add('login', (username, password) => {
    return cy.loginApi(username, password)
})

Cypress.Commands.add('logoutUI', () => {
    const debugging = false
    const log = Cypress.log({
        name: 'logoutUI',
        displayName: 'LOGOUT (UI)',
        message: '🚪',
        autoEnd: true
    })

    cy.contains('[data-cy=q-toolbar] [data-cy=q-btn] [data-cy=q-icon]', 'person', { log: debugging }).click({ log: debugging })
    cy.contains('exit_to_app', { log: debugging }).click({ log: debugging })
    cy.url({ log: debugging }).should((url) => {
        // NOTE: "should" does not support "{ log: false }" so it's a workaround for that
        const loginPageURL = /\/#\/login$/
        if (!loginPageURL.test(url)) {
            expect(url).to.match(loginPageURL)
        }
    })

    log.end()
})

Cypress.Commands.add('logout', () => {
    return cy.logoutUI()
})
