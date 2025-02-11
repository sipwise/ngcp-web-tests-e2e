/// <reference types="cypress" />

import {
    deleteItemOnListPageBy,
    apiCreateDomain,
    apiLoginAsSuperuser,
    apiRemoveDomainBy
} from '../../../support/ngcp-aui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

export const domain = {
    reseller_id: 1,
    domain: 'domainDomains'
}

context('Domain tests', () => {
    context('UI domain tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveDomainBy({ name: domain.domain, authHeader })

                cy.log('Seeding db...')
                apiCreateDomain({ data: domain, authHeader })
            })
        })

        after(() => {
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
                cy.log('Data clean up...')
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Check if domain with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')
            cy.locationShouldBe('#/domain')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="domain-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a domain', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')
            cy.locationShouldBe('#/domain')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('input[data-cy="domain-name"]').type(domain.domain)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')
            cy.locationShouldBe('#/domain')
            deleteItemOnListPageBy(domain.domain)
        })
    })
})
