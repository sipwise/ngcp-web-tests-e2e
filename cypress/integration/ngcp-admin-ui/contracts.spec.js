/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarDropdownActionButton,
    searchInDataTable,
    deleteItemOnListPageByName
} from '../../support/ngcp-admin-ui/utils/common'

const ngcpConfig = Cypress.config('ngcpConfig')

const contractName = 'contract' + getRandomNum()

context('Contract tests', () => {
    context('UI contract tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        ;[
            { type: 'peering', checkUrl: '#/contract/peering/create' },
            { type: 'reseller', checkUrl: '#/contract/reseller/create' }
        ].forEach(testsGroup => {
            const contractType = testsGroup.type
            const formUrl = testsGroup.checkUrl

            context(`Contact type: ${contractType}`, () => {
                it(`Check if ${contractType} contact with invalid values gets rejected`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    cy.get('[data-cy="aui-list-action"]').click()
                    clickToolbarDropdownActionButton(`contract-create-${contractType}`)

                    cy.locationShouldBe(formUrl)
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('[data-cy=aui-contract-creation] div[role=alert]', 'Input is required').should('be.visible')
                })

                it(`Create a ${contractType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    cy.get('[data-cy="aui-list-action"]').click()
                    clickToolbarDropdownActionButton(`contract-create-${contractType}`)

                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
                    cy.get('label[data-cy="external-num"]').type(contractName)
                    cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Active' })
                    cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'Default', itemContains: 'Default Billing Profile' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('.q-notification', 'Contract created successfully').should('be.visible')
                })

                it(`Edit ${contractType} status`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')

                    searchInDataTable(contractName)
                    cy.get('[data-cy="row-more-menu-btn"]:first').click()
                    cy.get('[data-cy="aui-popup-menu-item--contract-edit"]').click()
                    waitPageProgress()
                    cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Pending' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgress()
                    cy.get('[data-cy="aui-close-button"]').click()
                    cy.get('[data-cy="q-td--status"]').contains('Pending')
                })

                it(`Delete ${contractType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    deleteItemOnListPageByName(contractName)
                })
            })
        })
    })
})
