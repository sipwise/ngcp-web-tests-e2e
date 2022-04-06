/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarDropdownActionButton,
    searchInDataTable,
    deleteItemOnListPageByName
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiRemoveContractBy
} from '../../support/ngcp-admin-ui/utils/api'

const peeringContract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const resellerContract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Contract tests', () => {
    context('UI contract tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContract({ data: peeringContract, authHeader })
                apiCreateContract({ data: resellerContract, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                apiRemoveContractBy({ name: resellerContract.external_id, authHeader })
            })
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
                    cy.get('label[data-cy="aui-select-contact"][error="true"]').should('be.visible')
                    cy.get('label[data-cy="aui-billing-profile-Active"][error="true"]').should('be.visible')
                    cy.get('label[data-cy="contract-status"] div[role="alert"]').should('be.visible')
                })

                it(`Create a ${contractType} contact`, () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                        apiRemoveContractBy({ name: resellerContract.external_id, authHeader })
                    })
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')
                    cy.get('[data-cy="aui-list-action"]').click()
                    clickToolbarDropdownActionButton(`contract-create-${contractType}`)

                    if (contractType === 'peering') {
                        cy.get('label[data-cy="external-num"]').type(peeringContract.external_id)
                    } else {
                        cy.get('label[data-cy="external-num"]').type(resellerContract.external_id)
                    }
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
                    cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Active' })
                    cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'Default', itemContains: 'Default Billing Profile' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Edit ${contractType} status`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract-list')

                    cy.locationShouldBe('#/contract')

                    if (contractType === 'peering') {
                        searchInDataTable(peeringContract.external_id)
                    } else {
                        searchInDataTable(resellerContract.external_id)
                    }
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
                    if (contractType === 'peering') {
                        deleteItemOnListPageByName(peeringContract.external_id)
                    } else {
                        deleteItemOnListPageByName(resellerContract.external_id)
                    }
                })
            })
        })
    })
})
