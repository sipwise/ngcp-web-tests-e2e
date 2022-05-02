/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteItemOnListPageBy, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../support/ngcp-admin-ui/utils/api'

const contract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const systemContact = {
    email: 'contact' + getRandomNum() + '@example.com'
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller tests', () => {
    context('UI reseller tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    contract.contact_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
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
            cy.get('label[data-cy="aui-select-contract"][error="true"]').should('be.visible')
            cy.get('label[data-cy="reseller-name"] div[role="alert"]').should('be.visible')
        })

        it('Create a reseller', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
            })
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
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--reseller-edit"]').click()
            waitPageProgress()
            cy.qSelect({ dataCy: 'reseller-status', filter: '', itemContains: 'Locked' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('[data-cy="aui-data-table-inline-edit--select"]').should('contain.text', 'Locked')
        })

        it('Change branding color', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--reseller-details"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-main-menu-item--reseller-details-branding"]').click()
            waitPageProgress()
            cy.get('[data-cy="color-picker"]:first').click()
            cy.get('div[class="q-color-picker"]').should('be.visible')
            cy.get('label[data-cy="csc-font-color"]').type('rgba(0,0,0,1)')
            cy.get('label[data-cy="csc-background-color"]').type('rgba(0,110,0,1)')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Branding changed successfully').should('be.visible')
        })

        it('Delete reseller and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            deleteItemOnListPageBy(reseller.name)
        })
    })
})
