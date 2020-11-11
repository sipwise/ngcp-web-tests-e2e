/// <reference types="cypress" />

const ngcpConfigCSC = Cypress.config('ngcpConfigCSC')

context('Login page tests', () => {
    before(() => {
        cy.server()
    })

    beforeEach(() => {
        cy.visit('/')
    })

    it('login page route', () => {
        cy.visit('/')
        cy.url().should('eq', Cypress.config().baseUrl + '/#/login')

        cy.visit('/#/some-another-page')
        cy.url().should('eq', Cypress.config().baseUrl + '/#/login')
    })

    it('Try to login through API', () => {
        const loginData = {
            username: ngcpConfigCSC.username,
            password: ngcpConfigCSC.password
        }
        cy
            .request('POST', `${ngcpConfigCSC.apiHost}/login_jwt`, loginData)
            .then((response) => {
                expect(response.body).to.have.property('jwt')

                const quasarFrameworkDataPrefix = '__q_strn|'
                localStorage.csc_jwt = quasarFrameworkDataPrefix + response.body.jwt
                localStorage.csc_subscriberId = quasarFrameworkDataPrefix + response.body.subscriber_id
            })
    })

    it('Try to login through UI', () => {
        cy.get('input:first').type(ngcpConfigCSC.username)
        cy.get('input:last').type(ngcpConfigCSC.password)
        cy.get('.q-btn:last').click()
        cy.wait(2000)
    })


})
