/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    deleteItemOnListPageBy,
    searchInDataTable
} from '../../../support/e2e'

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractResellerTest',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactReseller@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Finished data cleanup')
            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                contract.contact_id = id
            })
            cy.log('Finished data creation, start running tests...')
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Starting cleanup...' })
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
        cy.log('Cleanup complete!')
    })

    it('Check if Reseller with invalid values gets rejected', () => {
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        cy.get('a[data-cy="aui-list-action--add"]').click()

        cy.locationShouldBe('#/reseller/create')
        cy.get('[data-cy="aui-select-contract"] input').type('totallyaninvalidvalueforsure')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('input[data-cy="aui-select-contract"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('input[data-cy="reseller-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')

    })

    it('Create a Reseller', () => {
        // Create Contract
        apiLoginAsSuperuser().then(authHeader => {
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                reseller.contract_id = id
            })
        })
        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        cy.get('a[data-cy="aui-list-action--add"]').click()

        cy.locationShouldBe('#/reseller/create')
        cy.auiSelectLazySelect({ dataCy: 'aui-select-contract', filter: systemContact.email, itemContains: systemContact.email })
        cy.get('[data-cy="reseller-name"] input').type(reseller.name)
        cy.get('[data-cy="aui-save-button"]').click()

        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.locationShouldBe('#/reseller')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
        })
    })

    it('Edit Reseller status to "locked"', () => {
        // Create Reseller and Contract, delete if already exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
            })
        })

        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        searchInDataTable(reseller.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--resellerEdit"]').click()
        cy.qSelect({ dataCy: 'reseller-status', filter: '', itemContains: 'Locked' })
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('[data-cy="aui-close-button"]').click()
        cy.get('[data-cy="aui-data-table-inline-edit--select"]').should('contain.text', 'Locked')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
        })
    })

    it('Delete Reseller and check if they are deleted', () => {
        // Create Reseller and Contract, delete if already exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ external_id: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
            })
        })

        cy.quickLoginAUI(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        deleteItemOnListPageBy(reseller.name)
    })
})
