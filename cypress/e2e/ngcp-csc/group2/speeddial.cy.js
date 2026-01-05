/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgressCSC,
    getRandomNum
} from '../../../support/e2e'

export const domain = {
    domain: 'domainSpeed',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberSpeed',
    webusername: 'subscriberSpeed',
    email: 'subscriberSpeed@test.com',
    external_id: 'subscriberSpeed',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 8888
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerSpeed',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Speed dial "General" page tests', () => {
    context('UI speed dial "General" tests', () => {
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

        it('Add/Delete speed dial', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/speeddial"]').click()

            waitPageProgressCSC()
            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*1').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-more"]').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').should('not.exist')
        })

        it('Add/Delete two speed dials', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/speeddial"]').click()

            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*1').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*2').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testanotherspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *2').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testanotherspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-more"]:first').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('not.exist')

            cy.get('button[data-cy="csc-speeddial-more"]:first').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').should('not.exist')
        })
    })
})
