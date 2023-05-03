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
    waitPageProgress
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

context('Speed dial "General" page tests', () => {
    context('UI speed dial "General" tests', () => {
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

        it('Add/Delete speed dial', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/speeddial"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*1').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-more"]').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').should('not.exist')
        })

        it('Add/Delete two speed dials', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/speeddial"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*1').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-add"]').click()
            cy.get('div[data-cy="csc-speeddial-slot"]').click()
            cy.get('div[aria-selected="false"]').contains('*2').click()
            cy.get('input[data-cy="csc-speeddial-destination"]').type('testanotherspeeddial')
            cy.get('button[data-cy="csc-speeddial-save"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *2').should('be.visible')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testanotherspeeddial').should('be.visible')

            cy.get('button[data-cy="csc-speeddial-more"]:first').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').contains('When I dial *1').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').contains('ring testspeeddial').should('not.exist')

            cy.get('button[data-cy="csc-speeddial-more"]:first').click()
            cy.get('div[data-cy="csc-speeddial-remove"]').click()
            cy.get('button[data-autofocus="true"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            cy.get('div[data-cy="csc-speeddial-ring"]').should('not.exist')
        })
    })
})
