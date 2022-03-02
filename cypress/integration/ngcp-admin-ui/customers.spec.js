/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteItemOnListPageByName,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem
} from '../../support/ngcp-admin-ui/utils/common'

const ngcpConfig = Cypress.config('ngcpConfig')

const customer = {
    id: 'customer' + getRandomNum()
}

context('Customer tests', () => {
    context('UI customer tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        it('Check if customer with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            clickToolbarActionButton('customer-creation')

            cy.locationShouldBe('#/customer/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-billing-profile"][error="true"]').should('be.visible')
            cy.get('label[data-cy="aui-select-contact"][error="true"]').should('be.visible')
        })

        it('Create a customer', () => {
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

        it('Edit customer status to "locked"', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-edit')
            waitPageProgress()

            cy.qSelect({ dataCy: 'customer-status', filter: '', itemContains: 'Locked' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="q-td--status"]').contains('Locked')
        })

        it.skip('Add and remove max. subscribers from customer', () => { // Temporarily disabled due to bug: clearing field by keyboard causes error 500
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.id)
            cy.get('[data-cy="q-td--max-subscribers"] [data-cy^="aui-data-table-inline-edit--"]').click()
            cy.get('[data-cy="aui-data-table-edit-input--popup"] input').type('50')
            cy.contains('.q-popup-edit__buttons button', 'Save').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--max-subscribers"] span', '50').should('exist')
            cy.contains('[data-cy="q-td--max-subscribers"] span', '50').click()
            cy.get('[data-cy="aui-data-table-edit-input--popup"] input').clear() // TODO: we need to clarify why we receive error 500 from backend for empty string value
            cy.contains('.q-popup-edit__buttons button', 'Save').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--max-subscribers"] button', 'add').should('exist')
        })

        it('Add/Reset/Delete a preference (concurrent_max) in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-preferences')
            waitPageProgress()

            cy.get('[data-cy="q-item--concurrent-max"]').should('be.visible').as('concurrentMax')
            cy.get('@concurrentMax').find('input').type('500')
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@concurrentMax').find('input').should('have.value', '500')
            cy.get('@concurrentMax').contains('button[data-cy="q-icon"]', 'cancel').click()
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@concurrentMax').find('input').should('have.value', '')
            cy.get('@concurrentMax').find('input').type('500')
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Reset').click()
            cy.get('@concurrentMax').find('input').should('have.value', '')
        })

        it('Add/Delete a preference (allowed_clis) in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-preferences')
            waitPageProgress()

            cy.get('[data-cy="q-item--allowed-clis"]').should('be.visible').as('allowedCLIs')
            cy.get('@allowedCLIs').find('input').type('test')
            cy.get('@allowedCLIs').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"]').should('contain.text', 'test')
            cy.get('@allowedCLIs').find('input').type('testtest')
            cy.get('@allowedCLIs').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--testtest-1"]').should('contain.text', 'testtest')
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"] i[role="presentation"][data-cy="q-icon"]').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--testtest-0"]').should('be.visible')
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"]').should('not.exist')
        })

        it('Delete customer and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            deleteItemOnListPageByName(customer.id)
        })
    })
})
