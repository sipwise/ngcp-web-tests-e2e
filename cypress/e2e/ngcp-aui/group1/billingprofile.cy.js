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
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateBillingProfileZone,
    apiCreateBillingProfileFee,
    apiRemoveBillingProfileFeeBy,
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const billingProfile = {
    name: 'billingProfileCypress',
    handle: 'profilehandle1',
    reseller_id: null
}

const billingProfileZone = {
    zone: 'testBFCypress',
    detail: 'profiledetailbillingProfileZone',
    billing_profile_id: null
}

const billingProfileFee = {
    billing_zone_id: null,
    billing_profile_id: null,
    destination: 'billingProfileFeeCypress',
    direction: 'out',
    offpeak_follow_interval: 1,
    offpeak_init_interval: 1,
    onpeak_follow_interval: 1,
    onpeak_init_interval: 1
}

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractBillingProfileCypress',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 0,
    status: 'active',
    rtc_networks: {},
    name: 'testBillingProfileCypress',
    enable_rtc: false
}

const systemContact = {
    email: 'testBilling@example.com'
}

context('Billing profile tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
            apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
            apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        billingProfile.reseller_id = id
                    })
                })
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
            apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
            apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
    })
    context('Billing Profile tests', () => {
        it('Check if billing profile with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/billing/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingprofiles-handle"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingprofiles-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a billing profile', () => {
            // Setup: Delete Billing Profile in case it already exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/billing/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="billingprofiles-handle"]').type(billingProfile.handle)
            cy.get('label[data-cy="billingprofiles-name"]').type(billingProfile.name)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Make billing profile prepaid', () => {
            // Setup: Create Billing Profile
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileEdit"]').click()
            waitPageProgressAUI()

            cy.get('div[data-cy="billingprofiles-prepaid"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"][aria-checked="true"]').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Delete billing profile and check if it is deleted', () => {
            // Setup: Create Billing Profile
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            deleteItemOnListPageBy(billingProfile.name, 'Name')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })
    })

    context('Billing Profile Zone tests', () => {
        it('Check if billing profile zone with invalid values gets rejected', () => {
            // Setup: Create Billing Profile
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgressAUI()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="billing-zone"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Create a billing profile zone', () => {
            // Setup: Create Billing Profile, delete Billing Profile Zone in case it already exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgressAUI()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('input[data-cy="billing-zone"]').type(billingProfileZone.zone)
            cy.get('input[data-cy="billing-detail"]').type(billingProfileZone.detail)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Edit a billing profile zone', () => {
            // Setup: Create Billing Profile and Billing Zone
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    apiCreateBillingProfileZone({ data: {...billingProfileZone, billing_profile_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgressAUI()

            searchInDataTable(billingProfileZone.zone)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingZoneEdit"]').click()
            cy.get('input[data-cy="billing-detail"]').clear().type("testdetail")
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()
            cy.get('span[data-cy="aui-data-table-highlighted-text"]').contains("testdetail").should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Delete a billing profile zone and check if it is deleted', () => {
            // Setup: Create Billing Profile and Billing Zone
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    apiCreateBillingProfileZone({ data: {...billingProfileZone, billing_profile_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileZones"]').click()
            waitPageProgressAUI()

            deleteItemOnListPageBy(billingProfileZone.zone)

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })
    })

    context('Billing Profile Fee tests', () => {
        it('Check if billing profile fee with invalid values gets rejected', () => {
            // Setup: Create Billing Profile
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgressAUI()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-zone"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="billingfees-destination"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Create a billing profile fee', () => {
            // Setup: Create Billing Profile, delete Billing Profile Fee if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    apiCreateBillingProfileZone({ data: {...billingProfileZone, billing_profile_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgressAUI()

            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-zone', filter: billingProfileZone.zone, itemContains: billingProfileZone.zone })
            cy.get('input[data-cy="billingfees-destination"]').type(billingProfileFee.destination)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Edit a billing profile fee direction', () => {
            // Setup: Create Billing Profile, Billing Zone and Billing Profile Fee
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    billingProfileZone.billing_profile_id = id
                    billingProfileFee.billing_profile_id = id
                    apiCreateBillingProfileZone({ data: billingProfileZone, authHeader }).then(({ id }) => {
                        billingProfileFee.billing_zone_id = id
                        apiCreateBillingProfileFee({ data: billingProfileFee, authHeader })
                    })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgressAUI()

            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingFeeEdit"]').click()

            cy.qSelect({ dataCy: 'bilingfees-direction', itemContains: 'inbound' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()
            cy.get('span[data-cy="aui-data-table-highlighted-text"]').contains("inbound").should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })

        it('Delete a billing profile fee and check if it is deleted', () => {
            // Setup: Create Billing Profile, Billing Zone and Billing Profile Fee
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                    billingProfileZone.billing_profile_id = id
                    billingProfileFee.billing_profile_id = id
                    apiCreateBillingProfileZone({ data: billingProfileZone, authHeader }).then(({ id }) => {
                        billingProfileFee.billing_zone_id = id
                        apiCreateBillingProfileFee({ data: billingProfileFee, authHeader })
                    })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / billing')

            cy.locationShouldBe('#/billing')
            searchInDataTable(billingProfile.name, 'Name')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingProfileFees"]').click()
            waitPageProgressAUI()

            deleteItemOnListPageBy()

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileFeeBy({ name: billingProfileFee.destination, authHeader })
                apiRemoveBillingProfileZoneBy({ zone: billingProfileZone.zone, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            })
        })
    })
})
