/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    getRandomNum,
} from '../../../support/ngcp-csc/e2e'

export const domain = {
    domain: 'domainLogin',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberLogin',
    webusername: 'subscriberLogin',
    email: 'subscriberLogin@test.com',
    external_id: 'subscriberLogin',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 5555
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerLogin',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const ngcpConfig = Cypress.config('ngcpConfig')

function checkLoginAPIResponse (response) {
    expect(response.status || response.statusCode).to.equal(200)
    expect(response.body).to.have.property('jwt')
}

context('Login page tests', () => {
    context('UI login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                     subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiCreateSubscriber({ data:  subscriber, authHeader })
            })
            if (Cypress.currentTest.title === 'Check if unknown URL will route to login page') {
                cy.log('Skip beforeEach visit for this test to prevent freezing')
            } else {
                cy.visit('/')
            }
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
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
            cy.get('input:first').type(loginInfo.username)
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
            cy.get('input:first').type(loginInfo.username)
            cy.get('input:last').type(loginInfo.password)
            cy.get('.q-btn:last').click()

            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
            })
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
        })

        it('Test cy.loginUI function', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')
            })
        })

        it('Trying to logout', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('button[data-cy="user-menu"]').click()
            cy.get('div[data-cy="user-logout"]').click()
            cy.url().should('match', /\/#\/login$/)
        })

        it('Try to change to all available languages', () => {
            cy.contains('language').click()
            cy.contains('Deutsch').click()
            cy.contains('Teilnehmer-Anmeldung').should('be.visible')
            cy.contains('language').click()
            cy.contains('Español').click()
            cy.contains('Iniciar sesión de suscriptor').should('be.visible')
            cy.contains('language').click()
            cy.contains('Français').click()
            cy.contains('Authentification de l’abonné').should('be.visible')
            cy.contains('language').click()
            cy.contains('Italian').click()
            cy.contains('Accesso abbonato').should('be.visible')
            cy.contains('language').click()
            cy.contains('English').click()
            cy.contains('Subscriber Sign In').should('be.visible')
        })
    })

    // TODO: we need to add tests to check login process for usernames like "username" and "username@domain".
    //       If the baseURL is "https://localhost" we have to use "username@domain" only as the login username,
    //       but for the baseURL like "https://xxx.mgm.sipwise.com" we can use skip domain name in the login username
})
