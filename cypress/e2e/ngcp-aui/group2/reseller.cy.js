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
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable
} from '../../../support/ngcp-aui/e2e'

export const contract = {
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
    email: 'systemContact@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller tests', () => {
    context('UI reseller tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    contract.contact_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })

                cy.log('Seeding up db...')
                apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
                })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            })
        })

        it('Check if reseller with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/reseller/create')
            cy.get('[data-cy="aui-select-contract"] input').type('totallyaninvalidvalueforsure')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="aui-select-contract"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="reseller-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a reseller', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/reseller/create')
            cy.get('[data-cy=aui-select-contract] [data-cy=aui-create-button]').click()

            cy.locationShouldBe('#/contract/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'default', itemContains: 'Default Billing Profile' })
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
            cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Pending' })
            cy.get('input[data-cy="external-num"]').type(reseller.contract_id)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Contract created successfully').should('be.visible')

            cy.locationShouldBe('#/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contract', filter: reseller.contract_id, itemContains: 'default-system' })
            cy.get('[data-cy="reseller-name"] input').type(reseller.name)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/reseller')
        })

        it('Edit reseller status to "locked"', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--resellerEdit"]').click()
            waitPageProgress()
            cy.qSelect({ dataCy: 'reseller-status', filter: '', itemContains: 'Locked' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('[data-cy="aui-data-table-inline-edit--select"]').should('contain.text', 'Locked')
        })

        it('Change branding color', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-detail-page-menu"]').contains('Branding').click()
            waitPageProgress()
            cy.get('[data-cy="color-picker"]:first').click()
            cy.get('div[class="q-color-picker"]').should('be.visible')
            cy.get('input[data-cy="csc-font-color"]').click()
            cy.get('div[class="q-color-picker"]').should('not.exist')
            cy.get('label[data-cy="csc-font-color"]').type('rgba(0,0,0,1)')
            cy.get('[data-cy="color-picker"]:last').click()
            cy.get('div[class="q-color-picker"]').should('be.visible')
            cy.get('input[data-cy="csc-background-color"]').click()
            cy.get('div[class="q-color-picker"]').should('not.exist')
            cy.get('label[data-cy="csc-background-color"]').type('rgba(0,110,0,1)')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Branding changed successfully').should('be.visible')
        })

        it('Delete reseller and check if they are deleted', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            deleteItemOnListPageBy(reseller.name)
        })
    })
})
