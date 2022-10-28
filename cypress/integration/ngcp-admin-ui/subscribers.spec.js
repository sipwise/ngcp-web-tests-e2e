/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy
} from '../../support/ngcp-admin-ui/utils/api'

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
    email: 'email' + getRandomNum() + '@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

context('Subscriber tests', () => {
    context('UI subscriber tests', () => {
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

        it('Check if subscriber with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerDetails')
            waitPageProgress()
            cy.get('[data-cy="aui-main-menu-item--customer-details-subscribers"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-list-action--customer-subscriber-create"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-domain"][error="true"]').should('be.visible')
            cy.get('label[data-cy="subscriber-sip-username"] div[role="alert"]').should('be.visible')
            cy.get('label[data-cy="subscriber-sip-password"] div[role="alert"]').should('be.visible')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domain.domain, itemContains: domain.domain })
            cy.get('input[data-cy="subscriber-sip-username"]').type(subscriber.username)
            cy.get('input[data-cy="subscriber-sip-password"]').type('inva')
            cy.get('input[data-cy="subscriber-email"]').type('invalid')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="subscriber-email"] div[role="alert"]').should('be.visible')
        })

        it('Create subscriber', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerDetails')
            waitPageProgress()
            cy.get('[data-cy="aui-main-menu-item--customer-details-subscribers"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-list-action--customer-subscriber-create"]').click()
            waitPageProgress()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domain.domain, itemContains: domain.domain })
            cy.get('input[data-cy="subscriber-web-username"]').type(subscriber.username)
            cy.get('[data-cy="subscriber-password-generate"]:first').click()
            cy.get('input[data-cy="subscriber-sip-username"]').type(subscriber.username)
            cy.get('[data-cy="subscriber-password-generate"]:last').click()
            cy.get('input[data-cy="subscriber-email"]').type(subscriber.email)
            cy.get('input[data-cy="subscriber-external-id"]').type(subscriber.external_id)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete subscriber and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-list')

            cy.locationShouldBe('#/subscriber')
            deleteItemOnListPageBy(subscriber.username)
        })
    })
})
