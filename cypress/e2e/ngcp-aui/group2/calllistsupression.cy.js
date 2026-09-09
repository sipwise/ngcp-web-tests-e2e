/// <reference types="cypress" />

import {
    deleteDownloadsFolder,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiLoginAsSuperuser,
    apiRemoveCallListSuppressionBy,
    apiCreateCallListSuppression
} from '../../../support/e2e'

const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')
const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

const callListSuppression = {
  pattern: 'testCallListSuppressionPattern',
  direction: 'outgoing',
  mode: 'filter',
  label: 'testCallListSuppressionLabel',
  domain: 'testCallListSuppressionDomain'
}

const secondCallListSuppression = {
  pattern: 'testSecondCallListSuppressionPattern',
  direction: 'outgoing',
  mode: 'filter',
  label: 'testSecondCallListSuppressionLabel',
  domain: 'testSecondCallListSuppressionDomain'
}

context('Call List Suppressions tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveCallListSuppressionBy({ name: secondCallListSuppression.label, authHeader })
            apiRemoveCallListSuppressionBy({ name: callListSuppression.label, authHeader })
            cy.log('Data clean up pre-tests completed')
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            cy.log('Cleaning up db...')
            apiRemoveCallListSuppressionBy({ name: callListSuppression.label, authHeader })

            cy.log('Seeding db...')
            apiCreateCallListSuppression({ data: callListSuppression, authHeader })
        })
    })

    after(() => {
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiRemoveCallListSuppressionBy({ name: secondCallListSuppression.label, authHeader })
            apiRemoveCallListSuppressionBy({ name: callListSuppression.label, authHeader })
            deleteDownloadsFolder()
        })
    })

    it('Check if Call List Suppression with invalid values gets rejected', () => {
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy=aui-save-button]').click()

        cy.get('input[data-cy="calllistsuppression-domain"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('input[data-cy="calllistsuppression-pattern"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('input[data-cy="calllistsuppression-label"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a Call List Suppression', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveCallListSuppressionBy({ name: callListSuppression.label, authHeader })
        })

        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')
        cy.get('a[data-cy="aui-list-action--add"]').click()

        cy.get('input[data-cy="calllistsuppression-domain"]').type(callListSuppression.domain)
        cy.get('input[data-cy="calllistsuppression-pattern"]').type(callListSuppression.pattern)
        cy.get('input[data-cy="calllistsuppression-label"]').type(callListSuppression.label)
        cy.get('[data-cy=aui-save-button]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')

        cy.get('td[data-cy="q-td--domain"]').should('contain.text', callListSuppression.domain)
        cy.get('td[data-cy="q-td--pattern"]').should('contain.text', callListSuppression.pattern)
        cy.get('td[data-cy="q-td--label"]').should('contain.text', callListSuppression.label)
    })

    it('Edit Call List Suppression', () => {
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')
        searchInDataTable(callListSuppression.label, 'Label')

        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--callListSuppressionEdit"]').click()

        cy.get('input[data-cy="calllistsuppression-domain"]').clear().type('changedDomain')
        cy.get('input[data-cy="calllistsuppression-pattern"]').clear().type('changedPattern')
        cy.get('[data-cy=aui-save-button]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()

        cy.get('td[data-cy="q-td--domain"]').should('contain.text', 'changedDomain')
        cy.get('td[data-cy="q-td--pattern"]').should('contain.text', 'changedPattern')
    })

    it('Download Call List Suppression', () => {
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')
        searchInDataTable(callListSuppression.label, 'Label')

        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-call-list-suppression-download"]').click()
        const filename = path.join(downloadsFolder, 'call_list_suppressions.csv')
        cy.readFile(filename, 'binary', { timeout: 2000 })
            .should(buffer => expect(buffer.length).to.be.gt(100))
    })

    it('Upload Call List Suppression, purge existing entries', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveCallListSuppressionBy({ name: callListSuppression.label, authHeader })
            apiCreateCallListSuppression({ data: secondCallListSuppression, authHeader })
        })

        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')

        cy.get('a[data-cy="aui-call-list-suppression-upload"]').click()
        cy.get('input[data-cy="phonebook-upload-field"]').selectFile(path.join(fixturesFolder, 'call_list_suppressions.csv'), { force: true })
        cy.get('div[data-cy="phonebook-purge"]').click()
        cy.get('[data-cy=aui-save-button]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')

        cy.get('td[data-cy="q-td--domain"]').should('contain.text', callListSuppression.domain)
        cy.get('td[data-cy="q-td--pattern"]').should('contain.text', callListSuppression.pattern)
        cy.get('td[data-cy="q-td--label"]').should('contain.text', callListSuppression.label)
        cy.get('td[data-cy="q-td--domain"]').contains(secondCallListSuppression.domain).should('not.exist')
        cy.get('td[data-cy="q-td--pattern"]').contains(secondCallListSuppression.pattern).should('not.exist')
        cy.get('td[data-cy="q-td--label"]').contains(secondCallListSuppression.label).should('not.exist')
    })

    it('Delete Call List Suppression', () => {
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / calllistsuppression')
        cy.locationShouldBe('#/calllistsuppression')

        deleteItemOnListPageBy(callListSuppression.label, 'Label')
    })
})
