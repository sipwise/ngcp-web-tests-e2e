/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    getRandomNum
} from '../../support/ngcp-csc-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customer' + getRandomNum(),
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const domain = {
    domain: 'domain' + getRandomNum(),
    reseller_id: 1
}

const subscriber = {
    username: 'subscriber' + getRandomNum(),
    webusername: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const loginInfo = {
    username: subscriber.webusername + '@' + subscriber.domain,
    password: subscriber.webpassword
}

context('Call Settings "General" page tests', () => {
    context('UI Call Settings "General" tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        it('Enable/Disable "Music on Hold"', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-settings"]').click()

            cy.get('div[data-cy="music-on-hold"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="music-on-hold"]').click()
            cy.get('div[data-cy="music-on-hold"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="music-on-hold"]').click()
            cy.get('div[data-cy="music-on-hold"][aria-checked="false"]').should('be.visible')
        })

        it('Enable/Disable "Hide your number to the callee"', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/privacy"]').click()

            cy.get('div[data-cy="csc-privacy-hide"] svg').should('not.exist')
            cy.get('div[data-cy="csc-callee-hide"] svg').should('not.exist')
            cy.wait(1000)
            cy.get('div[data-cy="csc-privacy-hide"]').click()
            cy.get('div[data-cy="csc-privacy-hide"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-privacy-hide"]').click()
            cy.get('div[data-cy="csc-privacy-hide"][aria-checked="false"]').should('be.visible')
            cy.get('div[data-cy="csc-callee-hide"]').click()
            cy.get('div[data-cy="csc-callee-hide"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-callee-hide"]').click()
            cy.get('div[data-cy="csc-callee-hide"][aria-checked="false"]').should('be.visible')
        })
    })
})
