/// <reference types="cypress" />

const ngcpConfig = Cypress.config('ngcpConfig')

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
    })
    context('UI login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        beforeEach(() => {
            cy.visit('/')
            // adding wait here, otherwise inputs will be dropped
            cy.wait(500)
        })

        it('Check if using "/" will route to login page', () => {
            cy.visit('/')
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it('Check if unknown URL will route to login page', () => {
            cy.visit('/#/some-another-page')
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it('Login through UI with no credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.contains('arrow_forward').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect user and password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').type('not-exists-password')
            cy.contains('arrow_forward').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type('not-exists-password')
            cy.contains('arrow_forward').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with no password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').clear()
            cy.contains('arrow_forward').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with correct credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type(ngcpConfig.password)
            cy.contains('arrow_forward').click()

            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
            })
            cy.get('a[href="#/dashboard"]').should('be.visible')
        })

        it('Test cy.loginUi function', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
                cy.get('a[href="#/dashboard"]').should('be.visible')
            })
        })

        it('Logout', () => {
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.contains(ngcpConfig.username).click()
            cy.contains('Logout').click()
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it('Change to all available languages', () => {
            cy.contains('language').click()
            cy.contains('Deutsch').click()
            cy.contains('Administrator-Anmeldung').should('be.visible')
            cy.contains('language').click()
            cy.contains('Español').click()
            cy.contains('Admin Sign In').should('be.visible')
            cy.contains('language').click()
            cy.contains('Français').click()
            cy.contains('Connexion Admin').should('be.visible')
            cy.contains('language').click()
            cy.contains('Italiano').click()
            cy.contains('Admin Sign In').should('be.visible')
            cy.contains('language').click()
            cy.contains('Русский').click()
            cy.contains('Вход Администратора').should('be.visible')
            cy.contains('language').click()
            cy.contains('English').click()
            cy.contains('Admin Sign In').should('be.visible')
        })
    })
})
