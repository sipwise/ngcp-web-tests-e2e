/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteItemOnListPageByName, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiRemoveResellerBy
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')

const resellerName = 'reseller' + getRandomNum()
const contractName = 'contract' + getRandomNum()

context('Reseller tests', () => {
    context('UI reseller tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        after(() => {
            // let's remove all data via API at the end of all tests
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: resellerName, authHeader })
            })
        })
        it('Check if reseller with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            clickToolbarActionButton('reseller-creation')

            cy.locationShouldBe('#/reseller/create')
            cy.get('[data-cy="aui-select-contract"] input').type('totallyaninvalidvalueforsure')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('div[role="alert"]', 'Input is required').should('be.visible')
        })

        it('Create a reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            clickToolbarActionButton('reseller-creation')

            cy.locationShouldBe('#/reseller/create')
            cy.get('[data-cy=aui-select-contract] [data-cy=aui-create-button]').click()

            cy.locationShouldBe('#/contract/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'default', itemContains: 'Default Billing Profile' })
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
            cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Pending' })
            cy.get('input[data-cy="external-num"]').type(contractName)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Contract created successfully').should('be.visible')

            cy.locationShouldBe('#/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contract', filter: contractName, itemContains: 'default-system' })
            cy.get('[data-cy="reseller-name"] input').type(resellerName)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.contains('.q-notification', 'Reseller created successfully').should('be.visible')
            cy.locationShouldBe('#/reseller')
        })

        it('Edit reseller status to "locked"', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(resellerName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--reseller-edit"]').click()
            waitPageProgress()
            cy.qSelect({ dataCy: 'reseller-status', filter: '', itemContains: 'Locked' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('[data-cy="aui-data-table-inline-edit--select"]').should('contain.text', 'Locked')
        })

        it('Enable WebRTC', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(resellerName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--reseller-edit"]').click()
            waitPageProgress()
            cy.get('[data-cy="web-rtc-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Reseller updated successfully').should('be.visible')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"][aria-checked="true"]').should('be.visible')
        })

        it('Add/Reset/Delete a preference (cdr_export_field_separator) in reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(resellerName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--reseller-preferences"]').click()
            cy.get('[data-cy="q-item--cdr-export-field-separator"]').should('be.visible').as('cdrExportFieldSeparator')
            cy.get('@cdrExportFieldSeparator').find('input').type('test')
            cy.get('@cdrExportFieldSeparator').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@cdrExportFieldSeparator').find('input').should('have.value', 'test')
            cy.get('@cdrExportFieldSeparator').contains('button[data-cy="q-icon"]', 'cancel').click()
            cy.get('@cdrExportFieldSeparator').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@cdrExportFieldSeparator').find('input').should('have.value', '')
            cy.get('@cdrExportFieldSeparator').find('input').type('test')
            cy.get('@cdrExportFieldSeparator').contains('button[data-cy="q-btn"]', 'Reset').click()
            cy.get('@cdrExportFieldSeparator').find('input').should('have.value', '')
        })

        it('Delete reseller and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            deleteItemOnListPageByName(resellerName)
        })
    })
})
