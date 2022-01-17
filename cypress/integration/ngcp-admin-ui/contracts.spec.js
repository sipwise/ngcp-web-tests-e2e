/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarDropdownActionButton, searchInDataTable
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
                    cy.get('div[label="Add"]').click() // TODO: fix issues in data-cy
                    clickToolbarDropdownActionButton(`contract-create-${contractType}`)

                    cy.locationShouldBe(formUrl)
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('[data-cy=aui-contract-creation] div[role=alert]', 'Input is required').should('be.visible')
                })

                it(`Create a ${contractType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    cy.get('div[label="Add"]').click() // TODO: fix issues in data-cy
                    clickToolbarDropdownActionButton(`contract-create-${contractType}`)

                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
                    cy.get('label[data-cy="external-num"]').type(contractName)
                    cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Active' })
                    cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'default', itemContains: 'Default Billing Profile' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('.q-notification', 'Contract created successfully').should('be.visible')
                })

                it(`Edit ${contractType} status`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')

                    searchInDataTable(contractName)
                    cy.get('span[data-cy="aui-data-table-edit-select"]').click() // TODO: improve selectors here
                    cy.get('.q-field__label').contains('Status').click({ force: true }) // TODO: improve selectors here
                    cy.get('div[data-cy="q-item--1"]').click()
                    cy.contains('Save').click() // TODO: add data-cy there
                    waitPageProgress()
                    cy.get('span[data-cy="aui-data-table-edit-select"]').contains('Pending')
                })

                it(`Delete ${contractType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    searchInDataTable(contractName)
                    cy.get('td[data-cy="q-td"]:first').click()
                    cy.get('[data-cy="aui-popup-menu-item--delete"]').click()
                    cy.get('button[data-cy="btn-confirm"]').click()
                    cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
                })
            })
        })
    })
})
