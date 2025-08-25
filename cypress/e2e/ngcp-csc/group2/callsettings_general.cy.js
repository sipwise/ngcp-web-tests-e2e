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
} from '../../../support/e2e'

export const domain = {
    domain: 'domainCallSettings',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberCallSett',
    webusername: 'subscriberCallSett',
    email: 'subscriberCallSett@test.com',
    external_id: 'subscriberCallSett',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 3333
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCallSett',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Call Settings "General" page tests', () => {
    context('UI Call Settings "General" tests', () => {
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
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Enable/Disable "Music on Hold"', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
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
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/privacy"]').click()

            cy.get('div[data-cy="csc-callee-hide"] svg').should('not.exist')
            cy.get('div[data-cy="csc-privacy-hide"] svg').should('not.exist')
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
