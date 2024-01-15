/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateProfilePackage,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveProfilePackageBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    deleteItemOnListPageBy,
    getRandomNum,
    searchInDataTable
} from '../../support/ngcp-admin-ui/e2e'

const mainResellerAdmin = {
    login: 'admin' + getRandomNum(),
    password: 'rand0mpassword12345',
    role: 'reseller',
    is_master: true,
    is_active: true,
    show_passwords: true,
    call_data: true,
    billing_data: true,
    reseller_id: null
}

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

const billingProfile = {
    name: 'profile' + getRandomNum(),
    handle: 'profilehandle' + getRandomNum(),
    reseller_id: null
}

const profilePackage = {
    balance_interval_unit: "minute",
    balance_interval_value: 60,
    description: "desc" + getRandomNum(),
    name: "profilepackage" + getRandomNum(),
    initial_profiles: [
        {
          profile_id: 0,
        }
      ],
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Profile package tests', () => {
    context('UI profile package tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            apiCreateBillingProfile({ data: { ...billingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                                profilePackage.initial_profiles[0].profile_id = id
                            })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateProfilePackage({data: profilePackage, authHeader})
                    })
                })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: mainResellerAdmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
            })
        })

        it('Check if profile package with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
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
                apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
                profilePackage.name = "profilepackage" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
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
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            searchInDataTable(profilePackage.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfilePackageEdit"]').click()
            cy.get('input[data-cy="profilepackages-description"]').clear().type('testDescription')
            cy.get('input[data-cy="profilepackages-balanceinterval"]').clear().type('10')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete profile package and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / package')

            cy.locationShouldBe('#/package')
            deleteItemOnListPageBy(profilePackage.name, 'Name')
        })
    })
})
