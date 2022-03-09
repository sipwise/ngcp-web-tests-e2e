/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageByName,
    searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateDomain,
    apiRemoveDomainBy,
    apiCreateCustomer,
    apiRemoveCustomerBy
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

const subscriber = {
    username: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    id: 'subid' + getRandomNum()
}

const domain = {
    domain: 'domain' + getRandomNum(),
    reseller_id: 1
}

context('Subscriber tests', () => {
    context('UI subscriber tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader })
            })
        })

        after(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            })
        })

        it('Check if subscriber with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--customer-details"]').click()
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
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--customer-details"]').click()
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
            cy.get('input[data-cy="subscriber-external-id"]').type(subscriber.id)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete subscriber and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-list')

            cy.locationShouldBe('#/subscriber')
            deleteItemOnListPageByName(subscriber.username)
        })
    })
})
