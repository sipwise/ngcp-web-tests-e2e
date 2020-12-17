/// <reference types="cypress" />

const ngcpConfigCSC = Cypress.config('ngcpConfigCSC')

function checkLoginAPIResponse (response) {
    expect(response.status || response.statusCode).to.equal(200)
    expect(response.body).to.have.property('jwt')
}

function CheckLoggedInUI () {
    cy.visit('/')
    cy.url().should('match', /\/#\/user\/home$/)
}

context('Login page tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfigCSC.apiHost })
    })

    beforeEach(() => {
        cy.visit('/')
    })

    it('login page route (/)', () => {
        cy.visit('/')
        cy.url().should('match', /\/#\/login$/)
    })

    it.skip('login page route (unknown URL)', () => {
        cy.visit('/#/some-another-page')
        cy.url().should('match', /\/#\/login$/)
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

    it('Trying to login through UI with incorrect user', () => {
        cy.intercept('POST', '**/login_jwt').as('loginRequest')
        cy.get('input:first').type('not-exists-user')
        cy.get('input:last').type('not-exists-password')
        cy.get('.q-btn:last').click()

        cy.wait('@loginRequest').then(({ response }) => {
            expect(response.statusCode).to.equal(403)
            cy.get('.q-notification').should('be.visible')
        })
    })

    it('Trying to login through UI with a correct user', () => {
        cy.intercept('POST', '**/login_jwt').as('loginRequest')
        cy.get('input:first').type(ngcpConfigCSC.username)
        cy.get('input:last').type(ngcpConfigCSC.password)
        cy.get('.q-btn:last').click()

        cy.wait('@loginRequest').then(({ response }) => {
            checkLoginAPIResponse(response)
        })
    })

    it('Testing "cy.login" command', () => {
        cy.login(ngcpConfigCSC.username, ngcpConfigCSC.password).then(() => {
            CheckLoggedInUI()
        })
    })
})
