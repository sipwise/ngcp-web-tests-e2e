/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageByName,
    clickDataTableSelectedMoreMenuItem, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'
import { apiCreateDomain, apiLoginAsSuperuser } from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')
const domainName = 'domain' + getRandomNum()

context('Domain tests', () => {
    context('UI domain tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
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
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('[data-cy=aui-list-action--domain-creation]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('input[data-cy="domain-name"]').type(domainName)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Add/Reset/Delete a preference (allowed_ips) in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domainName)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            cy.get('[data-cy="q-item--allowed-ips"]').should('be.visible').as('aIPSetting')

            const ipButtons = {
                ipv4button: '[data-cy="q-chip--10-0-0-1',
                ipv6button: '[data-cy="q-chip--2001-db-8-3333-4444-cccc-dddd-eeee-ffff',
                ipv4: '10.0.0.1',
                ipv6: '2001:db8:3333:4444:CCCC:DDDD:EEEE:FFFF'
            }

            cy.get('@aIPSetting').find('input').type('invalid')
            cy.get('@aIPSetting').contains('button[data-cy="q-btn"]', 'Add').click()
            cy.get('@aIPSetting').contains('div[role=alert]', 'Input must be a valid IPv4 or IPv6').should('be.visible')
            cy.get('@aIPSetting').find('input').clear().type(ipButtons.ipv4)
            cy.get('@aIPSetting').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@aIPSetting').find(ipButtons.ipv4button + '0"]').should('contain.text', ipButtons.ipv4)
            cy.get('@aIPSetting').find('input').type(ipButtons.ipv6)
            cy.get('@aIPSetting').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@aIPSetting').find(ipButtons.ipv6button + '-1"]').should('contain.text', ipButtons.ipv6)
            cy.get('@aIPSetting').find(ipButtons.ipv4button + '0"] .q-chip__icon--remove').click()
            waitPageProgress()
            cy.get('@aIPSetting').find(ipButtons.ipv6button + '-0"]').should('be.visible')
            cy.get('@aIPSetting').find(ipButtons.ipv4button + '0"]').should('not.exist')
            cy.get('@aIPSetting').find('input').type(ipButtons.ipv4)
            cy.get('@aIPSetting').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@aIPSetting').find(ipButtons.ipv4button + '1"]').should('contain.text', ipButtons.ipv4)
            cy.get('@aIPSetting').contains('button', 'Remove all').click()
            waitPageProgress()
            cy.get('@aIPSetting').find('[data-cy^="q-chip"]').should('not.exist')
        })

        it('Delete domain', () => {
            const domainToDelete = 'domain' + Math.random()
            apiLoginAsSuperuser().then((authHeader) => {
                return apiCreateDomain({
                    data: {
                        domain: domainToDelete,
                        reseller_id: 1
                    },
                    authHeader
                })
            }).then(() => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / domain-list')
                cy.locationShouldBe('#/domain')
                deleteItemOnListPageByName(domainToDelete)
            })
        })
    })
})
