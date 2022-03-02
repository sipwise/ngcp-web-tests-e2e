/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteItemOnListPageByName,
    searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

const ngcpConfig = Cypress.config('ngcpConfig')

const customer = {
    id: 'customer' + getRandomNum()
}

const subscriber = {
    username: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    id: 'subid' + getRandomNum()
}

const domainName = 'domain' + getRandomNum()

context('Subscriber tests', () => {
    context('UI subscriber tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        it('Create a customer', () => { // TODO: replace this entire "test" with one API call to make it faster and less prone to errors
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            clickToolbarActionButton('customer-creation')

            cy.locationShouldBe('#/customer/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="customer-external-id"] input').type(customer.id)
            cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Create a domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('[data-cy=aui-list-action--domain-creation]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy=aui-new-domain] .q-item:eq(1) input').type(domainName)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Check if subscriber with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.id)
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
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domainName, itemContains: domainName })
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
            searchInDataTable(customer.id)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--customer-details"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-main-menu-item--customer-details-subscribers"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-list-action--customer-subscriber-create"]').click()
            waitPageProgress()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domainName, itemContains: domainName })
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

        it('Delete customer and check if they are deleted', () => { // TODO: replace this entire "test" with one API call to make it faster and less prone to errors
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            deleteItemOnListPageByName(customer.id)
        })
    })
})
