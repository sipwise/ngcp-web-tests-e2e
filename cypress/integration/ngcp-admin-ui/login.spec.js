/// <reference types="cypress" />

const ngcpConfig = Cypress.config('ngcpConfig')

function checkLoginAPIResponse (response) {
    expect(response.status || response.statusCode).to.equal(200)
    expect(response.body).to.have.property('jwt')
}

function CheckLoggedInUI () {
    cy.get('.q-drawer').should('to.be.visible')
    cy.url().should('match', /\/#\/dashboard/)
}

context('Login page tests', () => {
    context('API direct login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        it('Testing "cy.loginAPI" command (valid user)', () => {
            // requesting API for JWT token, before we actually load our application UI
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginAPI(ngcpConfig.username, ngcpConfig.password).then(({ response }) => {
                checkLoginAPIResponse(response)
            })

            // we should open our application to "see" that stored JWT applied successfully
            cy.visit('/')
            CheckLoggedInUI()
        })

        it('Testing "cy.loginAPI" command (invalid user)', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginAPI('invalid-user', 'invalid-password').then(({ response }) => {
                expect(response.status || response.statusCode).to.not.equal(200)
            })
        })
    })

    context('UI login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        beforeEach(() => {
            cy.visit('/')
            // adding wait here, to be sure that inputs are intractable \ accessible
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
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect user and password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').type('not-exists-password')
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type('not-exists-password')
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with no password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').clear()
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with correct credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type(ngcpConfig.password)
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
            })
            CheckLoggedInUI()
        })

        it('Test helper functions cy.loginUi / cy.logoutUI', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
                CheckLoggedInUI()
            })
            cy.logoutUI()
            cy.url().should('match', /\/#\/login\/admin/)
        })
    })

    context('i18n tests', () => {
        beforeEach(() => {
            cy.visit('/')
            // adding wait here, to be sure that inputs are intractable \ accessible
            cy.wait(500)
        })

        it('Check if login page is available in all different languages', () => {
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Deutsch').click()
            cy.contains('[id="login-title"]', 'Administrator-Anmeldung').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Español').click()
            cy.contains('[id="login-title"]', 'Admin Sign In').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Français').click()
            cy.contains('[id="login-title"]', 'Connexion Admin').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Italiano').click()
            cy.contains('[id="login-title"]', 'Admin Sign In').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Русский').click()
            cy.contains('[id="login-title"]', 'Вход Администратора').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('English').click()
            cy.contains('[id="login-title"]', 'Admin Sign In').should('be.visible')
        })

        it('Check if main page is available in all different languges', () => {
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'Deutsch').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Übersicht').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'Español').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Tablón').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'Français').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Tableau de bord').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'Italiano').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Dashboard').should('be.visible')// TODO: update when italian translation is available
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'Русский').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Главная').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[data-cy="q-item-section"]', 'English').click()
            cy.contains('[data-cy="aui-main-menu-item--dashboard"]', 'Dashboard').should('be.visible')
        })
    })
})
