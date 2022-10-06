
import jwtDecode from 'jwt-decode'

const debugging = false
const quiet = {
    log: debugging
}

Cypress.Commands.add('loginAPI', (username, password) => {
    const log = Cypress.log({
        name: 'loginAPI',
        displayName: 'LOGIN (API)',
        message: `🔒 Authenticating: ${username}`,
        autoEnd: false
    })
    const ngcpConfig = Cypress.config('ngcpConfig')
    const loginData = {
        username,
        password
    }
    const apiLoginURL = `${ngcpConfig.apiHost}/login_jwt`

    return cy
        .request({
            method: 'POST',
            url: apiLoginURL,
            body: loginData,
            failOnStatusCode: false,
            ...quiet
        })
        .then((response) => {
            const statusCode = response.status || response.statusCode
            let jwt
            let adminId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                const decodedJwt = jwtDecode(jwt)
                adminId = decodedJwt.id

                const quasarFrameworkStrDataPrefix = '__q_strn|'
                const quasarFrameworkNumbDataPrefix = '__q_numb|'
                localStorage.aui_jwt = quasarFrameworkStrDataPrefix + jwt
                localStorage.aui_adminId = quasarFrameworkNumbDataPrefix + Number(adminId)
            }

            const logData = {
                apiURL: apiLoginURL,
                username,
                password,
                jwt,
                adminId
            }
            log.set({
                consoleProps () {
                    return logData
                }
            })
            log.end()

            return {
                ...logData,
                response
            }
        })
})

Cypress.Commands.add('loginUI', (username, password, waitForSidemenu = true) => {
    const log = Cypress.log({
        name: 'loginUI',
        displayName: 'LOGIN (UI)',
        message: `💻 🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    cy.intercept('POST', '**/login_jwt?lang=en').as('loginRequest')
    cy.get('input[data-cy="csc-login-username"]', quiet).type(username, quiet)
    cy.get('input[data-cy="csc-login-password"]', quiet).type(password, quiet)
    cy.get('button[data-cy="csc-login-button"]', quiet).click(quiet)
    const reqResponse =
        cy.wait('@loginRequest', quiet).then(({ response }) => {
            const statusCode = response.status || response.statusCode
            let jwt
            let adminId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                const decodedJwt = jwtDecode(jwt)
                adminId = decodedJwt.id
            }

            const logData = {
                apiURL: undefined,
                username,
                password,
                jwt,
                adminId
            }
            log.set({
                consoleProps () {
                    return logData
                }
            })

            return { ...logData, response }
        })

    if (waitForSidemenu) {
        // Waiting for user data requesting \ initialization.
        // Note: Unfortunately we cannot fully relay on requests waiting because we might have different amount of requests
        //       according to the user type.
        //       So, to be sure that we are logged in we are waiting for an unique UI element of MainLayout
        cy.get('.q-drawer', quiet).should('to.be.visible', quiet)
    }

    log.end()
    return reqResponse
})

const defaultLoginMode = 'api'
// const loginMode = 'ui'
Cypress.Commands.add('login', (username, password, loginMode = defaultLoginMode) => {
    let loginResponse
    if (String(loginMode).toLowerCase() === 'api') {
        loginResponse = cy.loginAPI(username, password)
        cy.visit('/')
        // adding wait here, to be sure that inputs are intractable \ accessible
        cy.wait(500)
    } else {
        cy.visit('/')
        // adding wait here, to be sure that inputs are intractable \ accessible
        cy.wait(500)
        loginResponse = cy.loginUI(username, password, false)
    }
    cy.get('.q-drawer').should('to.be.visible')
    return loginResponse
})

Cypress.Commands.add('logoutUI', () => {
    const log = Cypress.log({
        name: 'logoutUI',
        displayName: 'LOGOUT (UI)',
        message: '🚪',
        autoEnd: true
    })

    cy.intercept('GET', '**/ajax_logout').as('v1LogoutRequest')
    cy.get('button[data-cy="user-menu"]', quiet).click(quiet)
    cy.get('div[data-cy="user-logout"]', quiet).click(quiet)
    cy.wait('@v1LogoutRequest', quiet)
    cy.url(quiet).should((url) => {
        // NOTE: "should" does not support "{ log: false }" so it's a workaround for that
        const loginPageURL = /\/#\/login\/admin$/
        if (!loginPageURL.test(url)) {
            expect(url).to.match(loginPageURL)
        }
    })

    log.end()
})

Cypress.Commands.add('logout', () => {
    return cy.logoutUI()
})
