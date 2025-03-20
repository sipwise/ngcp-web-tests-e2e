/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateProfilePackage,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveProfilePackageBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    deleteItemOnListPageBy,
    searchInDataTable,
    waitPageProgress
} from '../../../support/ngcp-aui/e2e'

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractProfPack',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const billingProfile = {
    name: 'billingProfileProfCypress',
    handle: 'profilehandle123',
    reseller_id: null
}

const editBillingProfile = {
    name: 'editProfPackCypress',
    handle: 'profilehandle456',
    reseller_id: null
}

const profilePackage = {
    balance_interval_unit: 'minute',
    balance_interval_value: 60,
    description: 'desc',
    name: 'profileProfPackCypress',
    initial_profiles: [
        {
            profile_id: null,
            network_id: null
        }
      ],
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerProfPackCypress',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactProfilePackage@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Profile package tests', () => {
    context('UI profile package tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
                apiRemoveBillingProfileBy({ name: editBillingProfile.name, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            reseller.id = id
                            apiCreateBillingProfile({ data: { ...billingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                                profilePackage.initial_profiles[0].profile_id = id
                            })
                            apiCreateBillingProfile({ data: { ...editBillingProfile, reseller_id: id }, authHeader })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveProfilePackageBy({ name: profilePackage.name, authHeader })
                apiCreateProfilePackage({ data: profilePackage, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveProfilePackageBy({ name: profilePackage.name, authHeader })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
                apiRemoveBillingProfileBy({ name: editBillingProfile.name, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            })
        })

        it('Check if profile package with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/package/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="profilepackages-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="profilepackages-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="aui-select-initial-billing-profile"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="profilepackages-balanceinterval"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a profile package', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveProfilePackageBy({ name: profilePackage.name, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/package/create')
            cy.get('label[data-cy="profilepackages-name"]').type(profilePackage.name)
            cy.get('label[data-cy="profilepackages-description"]').type(profilePackage.description)
            cy.auiSelectLazySelect({ dataCy: 'aui-select-initial-billing-profile', filter: billingProfile.name, itemContains: billingProfile.name })
            cy.get('input[data-cy="profilepackages-balanceinterval"]').type('5')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit a profile package', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            searchInDataTable(profilePackage.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfilePackageEdit"]').click()
            cy.get('input[data-cy="profilepackages-description"]').clear().type('testDescription')
            cy.get('input[data-cy="profilepackages-balanceinterval"]').clear().type('10')
            cy.get('input[data-cy="aui-select-initial-billing-profile"]').click().type('{backspace}')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-initial-billing-profile', filter: billingProfile.name, itemContains: billingProfile.name })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--initial-profiles-grp"]').contains(billingProfile.name).should('be.visible')
        })

        it('Delete profile package and check if they are deleted', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            deleteItemOnListPageBy(profilePackage.name, 'Name')
        })
    })
})
