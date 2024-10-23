/// <reference types="cypress" />
//TODO: add timeset events when timeset events page gets ported
import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateCustomer,
    apiCreateCustomerContact,
    apiCreateReseller,
    apiCreateSoundSet,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveCustomerBy,
    apiRemoveCustomerContactBy,
    apiRemoveResellerBy,
    apiRemoveSoundSetBy, 
    apiRemoveSystemContactBy,
    deleteItemOnListPageBy,
    getRandomNum,
    searchInDataTable,
    waitPageProgress
} from '../../support/ngcp-admin-ui/e2e'
import { contract, customerPbx, reseller } from '../../support/aui-test-data';

const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

const billingProfile = {
    name: 'profile' + getRandomNum(),
    handle: 'profilehandle' + getRandomNum(),
    reseller_id: null
}

const soundSet = {
    reseller_id: 0,
    name: 'soundset' + getRandomNum(),
    description: 'desc' + getRandomNum()
}

// We are not exporting this object to avoid dependencies
// if we run tests in parallel in the future
const systemContactDependency = {
    email: 'systemContactDependencySoundsets@example.com'
}

// We are not exporting this object to avoid dependencies
// if we run tests in parallel in the future
const customerContact = {
    reseller_id: null,
    email: 'customerContactSoundset@example.com'
}

const fixturesFolder = Cypress.config('fixturesFolder')

context('Soundset tests', () => {
    context('UI soundset tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
                apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                apiRemoveCustomerContactBy({ email: customerPbx.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            soundSet.reseller_id = id
                            apiCreateBillingProfile({ data: { ...billingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                                customerPbx.billing_profile_id = id
                            })
                            apiCreateCustomerContact({ data: { ...customerContact, reseller_id: id }, authHeader }).then(({ id }) => {
                                customerPbx.contact_id = id
                                apiCreateCustomer({ data: { ...customerPbx, contact_id: id }, authHeader }).then(({ id }) => {
                                    customerPbx.customer_id = id
                                })
                            })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSoundSet({ data: soundSet, authHeader })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                apiRemoveCustomerContactBy({ email: customerPbx.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
            })
        })

        it('Check if soundset with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')
            cy.locationShouldBe('#/sound')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="soundsets-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a soundset', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')
            cy.locationShouldBe('#/sound')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="soundsets-name"]').type(soundSet.name)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit a soundset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')

            cy.locationShouldBe('#/sound')
            searchInDataTable(soundSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--soundSetsEdit"]').click()
            cy.get('input[data-cy="soundsets-description"]').clear().type('testDescription')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--description"]').contains('testDescription').should('be.visible')
        })

        it('Upload/Delete sound in soundset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')
            cy.locationShouldBe('#/sound')
            searchInDataTable(soundSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--soundSetHandles"]').click()

            waitPageProgress()
            cy.get('div[data-cy="aui-list-item-title"]').contains('voucher_recharge').should('be.visible')
            cy.get('div[data-cy="aui-list-item-title"]').contains('calling_card').scrollIntoView()
            cy.get('div[data-cy="aui-list-item-title"]').contains('calling_card').click()
            cy.get('input[data-cy="soundsetfile-selectUpload"]:first').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: 'true' })
            cy.get('button[data-cy="soundsetfile-undo"]').click()
            cy.get('button[data-cy="soundsetfile-cloudUpload"]').should('not.exist')
            cy.get('input[data-cy="soundsetfile-selectUpload"]:first').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: 'true' })
            cy.get('button[data-cy="soundsetfile-cloudUpload"]').click()
            cy.get('button[data-cy="aui-player-play"]').click()
            cy.get('button[data-cy="aui-player-pause"]').should('be.visible')
            cy.wait(2000)
            cy.get('button[data-cy="aui-player-pause"]').click()
            cy.get('button[data-cy="aui-player-play"]').should('be.visible')
            cy.get('button[data-cy="aui-player-stop"]').click()
            cy.get('div[data-cy="aui-list-item-title"]').contains('calling_card').scrollIntoView()
            cy.get('button[data-cy="soundsetfile-delete"]').click()
            cy.get('button[data-cy="aui-player-play"]').should('not.exist')
            cy.get('button[data-cy="aui-player-stop"]').should('not.exist')
            cy.get('button[data-cy="soundsetfile-delete"]').should('not.exist')
        })

        it('Upload default soundset files', () => {
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.navigateMainMenu('settings / sound')

                    cy.locationShouldBe('#/sound')
                    searchInDataTable(soundSet.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--soundSetDefault"]').click()
                    waitPageProgress()
                    cy.qSelect({ dataCy: 'soundsets-language', itemContains: 'de' })
                    cy.get('div[data-cy="soundsets-loopplay"]').click()
                    cy.get('div[data-cy="soundsets-replace_existing"]').click()
                    cy.get('div[class="aui-base-sub-context"]').click()
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]', {timeout: 30000}).should('have.class', 'bg-positive')
                } else {
                    cy.navigateMainMenu('settings / sound')

                    cy.locationShouldBe('#/sound')
                    searchInDataTable(soundSet.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--soundSetDefault"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="soundsets-loopplay"]').click()
                    cy.get('div[data-cy="soundsets-replace_existing"]').click()
                    cy.get('div[class="aui-base-sub-context"]').click()
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]', {timeout: 30000}).should('have.class', 'bg-positive')
                }
            })
        })

        it('Assign soundset to customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')

            cy.locationShouldBe('#/sound')
            searchInDataTable(soundSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--soundSetsEdit"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-customer', filter: customerContact.email, itemContains: customerContact.email })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete soundset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / sound')
            cy.locationShouldBe('#/sound')
            deleteItemOnListPageBy(soundSet.name)
        })
    })
})
