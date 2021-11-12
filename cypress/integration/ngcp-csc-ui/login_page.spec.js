/// <reference types="cypress" />

const ngcpConfigCSC = Cypress.config('ngcpConfig')

function checkLoginAPIResponse (response) {
    expect(response.status || response.statusCode).to.equal(200)
    expect(response.body).to.have.property('jwt')
}

function CheckLoggedInUI () {
    cy.visit('/')
    cy.url().should('match', /\/#\/user\/dashboard/)
}

context('Login page tests', () => {
    context('API direct login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfigCSC.apiHost })
        })

        beforeEach(() => {
            cy.visit('/')
        })

        it('Testing "cy.loginApi" command', () => {
            cy.loginApi(ngcpConfigCSC.username, ngcpConfigCSC.password).then(() => {
                CheckLoggedInUI()
            })
        })

        it('Trying to login through API', () => {
            const loginData = {
                username: ngcpConfigCSC.username,
                password: ngcpConfigCSC.password
            }
            cy
                .request('POST', `${ngcpConfigCSC.apiHost}/login_jwt`, loginData)
                .then(response => {
                    checkLoginAPIResponse(response)

                    const quasarFrameworkDataPrefix = '__q_strn|'
                    localStorage.csc_jwt = quasarFrameworkDataPrefix + response.body.jwt
                    localStorage.csc_subscriberId = quasarFrameworkDataPrefix + response.body.subscriber_id
                })
        })
    })
    context('UI login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfigCSC.apiHost })
        })

        beforeEach(() => {
            cy.visit('/')
        })

        it('Check if using "/" will route to login page', () => {
            cy.visit('/')
            cy.url().should('match', /\/#\/login$/)
        })

        it('Check if unknown URL will route to login page', () => {
            cy.visit('/#/some-another-page')
            cy.url().should('match', /\/#\/login$/)
        })

        it('Trying to login through UI with no credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-notification').should('be.visible')
            })
        })

        it('Trying to login through UI with incorrect user and password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').type('not-exists-password')
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-notification').should('be.visible')
            })
        })

        it('Trying to login through UI with incorrect password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfigCSC.username)
            cy.get('input:last').type('not-exists-password')
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-notification').should('be.visible')
            })
        })

        it('Trying to login through UI with no password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').clear()
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-notification').should('be.visible')
            })
        })

        it('Trying to login through UI with correct credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfigCSC.username)
            cy.get('input:last').type(ngcpConfigCSC.password)
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
            })
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
        })

        it('Test cy.loginUI function', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(ngcpConfigCSC.username, ngcpConfigCSC.password)
            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')
            })
        })

        it('Trying to logout', () => {
            cy.loginUI(ngcpConfigCSC.username, ngcpConfigCSC.password)
            cy.logoutUI()
            cy.url().should('match', /\/#\/login$/)
        })

        it('Try to change to all available languages', () => {
            cy.contains('language').click()
            cy.contains('Deutsch').click()
            cy.contains('Subscriber-Anmeldung').should('be.visible')
            cy.contains('language').click()
            cy.contains('Español').click()
            cy.contains('Iniciar sesión de suscriptor').should('be.visible')
            cy.contains('language').click()
            cy.contains('Français').click()
            cy.contains('Authentification de l’abonné').should('be.visible')
            cy.contains('language').click()
            cy.contains('Italiano').click()
            cy.contains('Accedi come utente').should('be.visible')
            cy.contains('language').click()
            cy.contains('Русский').click()
            cy.contains('Регистрация подписчика').should('be.visible')
            cy.contains('language').click()
            cy.contains('English').click()
            cy.contains('Subscriber Sign In').should('be.visible')
        })
    })

    // TODO: we need to add tests to check login process for usernames like "username" and "username@domain".
    //       If the baseURL is "https://localhost" we have to use "username@domain" only as the login username,
    //       but for the baseURL like "https://xxx.mgm.sipwise.com" we can use skip domain name in the login username
})
