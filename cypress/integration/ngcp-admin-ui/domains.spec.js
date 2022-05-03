/// <reference types="cypress" />

import {
    getRandomNum,
    deleteItemOnListPageBy
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateDomain,
    apiLoginAsSuperuser,
    apiRemoveDomainBy
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')

const domain = {
    reseller_id: 1,
    domain: 'domain' + getRandomNum()
}

context('Domain tests', () => {
    context('UI domain tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })
        it('Check if domain with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('[data-cy=aui-list-action--domain-creation]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('label[data-cy="aui-select-reseller"][error="true"]').should('be.visible')
            cy.get('label[data-cy="domain-name"] div[role="alert"]').should('be.visible')
        })

        it('Create a domain', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('[data-cy=aui-list-action--domain-creation]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('input[data-cy="domain-name"]').type(domain.domain)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            deleteItemOnListPageBy(domain.domain)
        })
    })
})
