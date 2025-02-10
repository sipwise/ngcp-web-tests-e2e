/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    searchInDataTable,
    deleteItemOnListPageBy,
    clickDataTableSelectedMoreMenuItem,
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../../support/ngcp-aui/e2e'

const peeringContract = {
    contact_id: null,
    status: 'active',
    external_id: 'peeringContract',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: null
}

const resellerContract = {
    contact_id: null,
    status: 'active',
    external_id: 'resellerTestContract',
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: null
}

export const dependencyContract = {
    contact_id: null,
    status: 'active',
    external_id: 'dependencyContractContracts',
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const dependencyReseller = {
    contract_id: null,
    status: 'active',
    name: 'testDepContracts',
    enable_rtc: false
}

const dependencyBillingProfile = {
    name: 'dependencyBPContracts',
    handle: 'string' + getRandomNum(),
    reseller_id: 0
}

const systemContactDependency = {
    email: 'systemCDContracts@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Contract tests', () => {
    context('UI contract tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                apiRemoveContractBy({ name: resellerContract.external_id, authHeader })
                apiRemoveBillingProfileBy({ name: dependencyBillingProfile.name, authHeader })
                apiRemoveResellerBy({ name: dependencyReseller.name, authHeader })
                apiRemoveContractBy({ name: dependencyContract.external_id, authHeader })
                apiRemoveSystemContactBy({email:systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    resellerContract.contact_id = id
                    peeringContract.contact_id = id
                    apiCreateContract({ data: { ...dependencyContract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...dependencyReseller, contract_id: id }, authHeader }).then(({ id }) => {
                            apiCreateBillingProfile({ data: { ...dependencyBillingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                                peeringContract.billing_profile_id = id
                                resellerContract.billing_profile_id = id
                            })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                apiRemoveContractBy({ name: resellerContract.external_id, authHeader })

                cy.log('Seeding db...')
                apiCreateContract({ data: peeringContract, authHeader })
                apiCreateContract({ data: resellerContract, authHeader })
            })
        })
        
        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                apiRemoveContractBy({ name: resellerContract.external_id, authHeader })
                apiRemoveBillingProfileBy({ name: dependencyBillingProfile.name, authHeader })
                apiRemoveResellerBy({ name: dependencyReseller.name, authHeader })
                apiRemoveContractBy({ name: dependencyContract.external_id, authHeader })
                apiRemoveSystemContactBy({email:systemContactDependency.email, authHeader })
            })
        })

        ;[
            { type: 'peering', checkUrl: '#/contract/peering/create' },
            { type: 'reseller', checkUrl: '#/contract/reseller/create' }
        ].forEach(testsGroup => {
            const contractType = testsGroup.type
            const formUrl = testsGroup.checkUrl

            context(`Contract type: ${contractType}`, () => {
                it(`Check if ${contractType} contract with invalid values gets rejected`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract')

                    cy.locationShouldBe('#/contract')
                    cy.get('button[data-cy="aui-list-action--add"]').click()
                    cy.get('a[href="' + formUrl + '"]').click()

                    cy.locationShouldBe(formUrl)
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('input[data-cy="aui-select-contact"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('input[data-cy="aui-billing-profile-Active"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('div[data-cy="contract-status"] input').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                })

                it(`Create a ${contractType} contract`, () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveContractBy({ name: peeringContract.external_id, authHeader })
                        apiRemoveContractBy({ name: resellerContract.external_id, authHeader })
                    })
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract')

                    cy.locationShouldBe('#/contract')
                    cy.get('button[data-cy="aui-list-action--add"]').click()
                    cy.get('a[href="' + formUrl + '"]').click()

                    if (contractType === 'peering') {
                        cy.get('input[data-cy="external-num"]').type(peeringContract.external_id)
                    } else {
                        cy.get('input[data-cy="external-num"]').type(resellerContract.external_id)
                    }
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
                    cy.get('div[data-cy="contract-status"]').click()
                    cy.wait(200)
                    cy.get('div[data-cy="contract-status"]').parents('label').then($el => {
                        const id = $el.attr('for')
                        const dropdownListId = `#${id}_lb`
                        cy.get(dropdownListId).should('be.visible')
                        cy.contains(`${dropdownListId} .q-item`, 'Active').should('be.visible')
                        cy.contains(`${dropdownListId} .q-item`, 'Active').click()
                    })
                    cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: dependencyBillingProfile.name, itemContains: dependencyBillingProfile.name })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Edit ${contractType} contract status`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract')

                    cy.locationShouldBe('#/contract')

                    if (contractType === 'peering') {
                        searchInDataTable(peeringContract.external_id)
                    } else {
                        searchInDataTable(resellerContract.external_id)
                    }
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    clickDataTableSelectedMoreMenuItem('contractEdit')
                    waitPageProgress()
                    cy.get('div[data-cy="contract-status"]').click()
                    cy.wait(200)
                    cy.get('div[data-cy="contract-status"]').parents('label').then($el => {
                        const id = $el.attr('for')
                        const dropdownListId = `#${id}_lb`
                        cy.get(dropdownListId).should('be.visible')
                        cy.contains(`${dropdownListId} .q-item`, 'Pending').should('be.visible')
                        cy.contains(`${dropdownListId} .q-item`, 'Pending').click()
                    })
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgress()
                    cy.get('[data-cy="aui-close-button"]').click()
                    cy.get('span[data-cy="aui-data-table-inline-edit--select"] span').contains('Pending')
                })

                it(`Delete ${contractType} contract`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contract')

                    cy.locationShouldBe('#/contract')
                    if (contractType === 'peering') {
                        deleteItemOnListPageBy(peeringContract.external_id)
                    } else {
                        deleteItemOnListPageBy(resellerContract.external_id)
                    }
                })
            })
        })
    })
})
