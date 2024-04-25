/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    apiRemoveBillingProfileZoneBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateBillingProfileZone,
    apiCreateBillingProfileFee,
    apiRemoveBillingProfileFeeBy,
} from '../../support/ngcp-admin-ui/e2e'

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
    name: 'billing' + getRandomNum(),
    handle: 'profilehandle' + getRandomNum(),
    reseller_id: null
}

const billingProfileZone = {
    zone: 'profilezone' + getRandomNum(),
    detail: 'profiledetail' + getRandomNum(),
    billing_profile_id: null
}

const billingProfileFee = {
    billing_zone_id: null,
    billing_profile_id: null,
    destination: "profilefee" + getRandomNum(),
    direction: "out",
    offpeak_follow_interval: 1,
    offpeak_init_interval: 1,
    onpeak_follow_interval: 1,
    onpeak_init_interval: 1
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Billing profile tests', () => {
    context('UI billing profile tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            billingProfile.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    billingProfileZone.billing_profile_id = id
                    billingProfileFee.billing_profile_id = id
                    apiCreateBillingProfileZone({ data: billingProfileZone, authHeader }).then(({ id }) => {
                        billingProfileFee.billing_zone_id = id
                        apiCreateBillingProfileFee({ data: billingProfileFee, authHeader })
                    })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ name: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Check if billing profile with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/billing/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingprofiles-handle"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingprofiles-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Check if billing profile zone with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgress()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.locationShouldBe('#/billing/'+ billingProfileZone.billing_profile_id + '/zones/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="billing-zone"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Check if billing profile fee with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgress()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.locationShouldBe('#/billing/'+ billingProfileFee.billing_profile_id + '/fees/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-zone"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingfees-destination"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a billing profile', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                billingProfile.name = 'billing' + getRandomNum()
                billingProfile.handle = 'profilehandle' + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/billing/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="billingprofiles-handle"]').type(billingProfile.handle)
            cy.get('label[data-cy="billingprofiles-name"]').type(billingProfile.name)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Make billing profile prepaid', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileEdit"]').click()
            waitPageProgress()

            cy.get('div[data-cy="billingprofiles-prepaid"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"][aria-checked="true"]').should('be.visible')
        })

        it('Create a billing profile zone', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ name: billingProfileZone.zone, authHeader })
                billingProfileZone.zone = 'profilezone' + getRandomNum()
                billingProfileZone.detail = 'profiledetail' + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgress()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.locationShouldBe('#/billing/'+ billingProfileZone.billing_profile_id + '/zones/create')
            cy.get('input[data-cy="billing-zone"]').type(billingProfileZone.zone)
            cy.get('input[data-cy="billing-detail"]').type(billingProfileZone.detail)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit a billing profile zone', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgress()

            searchInDataTable(billingProfileZone.zone)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingZoneEdit"]').click()
            cy.get('input[data-cy="billing-detail"]').clear().type("testdetail")
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('span[data-cy="aui-data-table-highlighted-text"]').contains("testdetail").should('be.visible')
        })

        it('Create a billing profile fee', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                billingProfileFee.destination = "profilefee" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgress()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.locationShouldBe('#/billing/'+ billingProfileFee.billing_profile_id + '/fees/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-zone', filter: billingProfileZone.zone, itemContains: billingProfileZone.zone })
            cy.get('input[data-cy="billingfees-destination"]').type(billingProfileFee.destination)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit a billing profile fee direction', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgress()

            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingFeeEdit"]').click()

            cy.qSelect({ dataCy: 'bilingfees-direction', itemContains: 'inbound' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('span[data-cy="aui-data-table-highlighted-text"]').contains("inbound").should('be.visible')
        })

        it('Delete a billing profile fee and check if it is deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgress()

            deleteItemOnListPageBy()
        })

        it('Delete a billing profile zone and check if it is deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgress()

            deleteItemOnListPageBy(billingProfileZone.zone)
        })

        it('Delete billing profile and check if it is deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            deleteItemOnListPageBy(billingProfile.name, 'Name')
        })
    })
})

