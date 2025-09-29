/// <reference types="cypress" />

import {
    apiCreateContract,
    apiCreateReseller,
    apiCreateCustomer,
    apiCreateProfilePackage,
    apiCreateSystemContact,
    apiCreateBillingVoucher,
    apiCreateCustomerContact,
    apiCreateBillingProfile,
    apiLoginAsSuperuser,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    apiRemoveBillingVoucherByResellerId,
    apiRemoveProfilePackageBy,
    apiRemoveCustomerBy,
    apiRemoveCustomerContactBy,
    apiRemoveBillingProfileBy,
    waitPageProgressAUI,
    searchInDataTable,
    apiGetProfilePackageId,
    apiRemoveBillingVoucherByPackageId
} from '../../../support/e2e'

export const contract = {
    contact_id: null,
    status: 'active',
    external_id: 'contractBillingVoucher',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const reseller = {
    contract_id: null,
    status: 'active',
    rtc_networks: {},
    name: 'resellerBillingVoucher',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactBillingVoucher@example.com'
}

const customerPbx = {
    billing_profile_definition: 'id',
    billing_profile_id: null,
    external_id: 'customerPbxBillingVoucher',
    contact_id: null,
    status: 'active',
    type: 'pbxaccount',
    customer_id: null
}
const profilePackage = {
    balance_interval_unit: 'minute',
    balance_interval_value: 60,
    description: 'desc',
    name: 'profilePackBillingVoucher',
    initial_profiles: [
        {
          profile_id: 1,
        }
      ],
}
const billingVoucher = {
    reseller_id: null,
    customer_id: null,
    package_id: null,
    code: "456",
    amount: 67,
    valid_until: "2026-01-22 00:05:10"
}
const customerContact = {
    reseller_id: null,
    email: 'testContactBillingVoucher@example.com'
}
const billingProfile = {
    name: 'profileBillingVoucher',
    handle: 'profilehandleBillingVoucher',
    reseller_id: null
}

const ngcpConfig = Cypress.config('ngcpConfig')
const fixturesFolder = Cypress.config('fixturesFolder')
const path = require('path')
let issppro = null

context('Billing vouchers tests', () => {
    context('UI billing vouchers tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo');
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password);
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    issppro = true
                    apiLoginAsSuperuser().then(authHeader => {
                        Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                        cy.log('Preparing environment...')
                        apiGetProfilePackageId({ name: profilePackage.name, authHeader }).then(({ id }) => {
                            apiRemoveBillingVoucherByPackageId({ package_id: id, authHeader, code: billingVoucher.code })
                        })
                        apiRemoveResellerBy({ name: reseller.name, authHeader })
                        apiRemoveContractBy({ name: contract.external_id, authHeader })
                        apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                        apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                        apiRemoveCustomerContactBy({ email: customerPbx.email, authHeader })
                        apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                        apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
                        cy.log('Data clean up pre-tests completed')

                        apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                            apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                                    billingVoucher.reseller_id = id
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
                        apiCreateProfilePackage({data: profilePackage, authHeader}).then(({ id }) => {
                            billingVoucher.package_id = id
                        })
                    })
                } else {
                    cy.log('Skipping all tests, because this is not an SPPRO instance');
                    issppro = false
                    return
                }
            })
        })

        beforeEach(() => {
            if (issppro) {
                apiLoginAsSuperuser().then(authHeader => {
                    cy.log('Cleaning up db...')
                    apiRemoveBillingVoucherByResellerId({reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code})

                    cy.log('Seeding db...')
                    apiCreateBillingVoucher({data: billingVoucher, authHeader})
                })
            }

        })

        after(() => {
            if (issppro) {
                Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
                cy.log('Data clean up...')
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveBillingVoucherByResellerId({ reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code })
                    apiRemoveResellerBy({ name: reseller.name, authHeader })
                    apiRemoveContractBy({ name: contract.external_id, authHeader })
                    apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                    apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                    apiRemoveCustomerContactBy({ email: customerPbx.email, authHeader })
                    apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                    apiRemoveProfilePackageBy({name: profilePackage.name, authHeader})
                })                
            } else {
                cy.log('Skipping cleanup, because this is not an SPPRO instance');
            }
        })

        it('Check if billing vouchers with invalid values gets rejected', function () {
            if (!issppro) {
                this.skip()
            }
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / voucher')
            cy.locationShouldBe('#/voucher')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="vouchers-code"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="vouchers-amount"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="vouchers-valid_until"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a Billing Vouchers', function () {
            if (!issppro) {
                this.skip()
            }
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingVoucherByResellerId({ reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / voucher')

            cy.locationShouldBe('#/voucher')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/voucher/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.auiSelectLazySelect({ dataCy: 'aui-select-customer', filter: customerContact.email, itemContains: customerContact.email })
            cy.auiSelectLazySelect({ dataCy: 'aui-select-profile-package', filter: profilePackage.name, itemContains: profilePackage.name })
            cy.get('input[data-cy="vouchers-code"]').type(billingVoucher.code)
            cy.get('input[data-cy="vouchers-amount"]').type(billingVoucher.amount)
            cy.get('input[data-cy="vouchers-valid_until"]').type(billingVoucher.valid_until)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Billing Vouchers created successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/voucher')
        })

        it('Edit a Billing Vouchers', function () {
            if (!issppro) {
                this.skip()
            }
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / voucher')

            cy.locationShouldBe('#/voucher')
            searchInDataTable(billingVoucher.code, 'code')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--billingVoucherEdit"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="vouchers-amount"]').clear().type(99)
            cy.get('input[data-cy="vouchers-valid_until"]').clear().type('2028-04-12 00:05:10')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Billing Vouchers updated successfully').should('be.visible')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
        })

        it.skip('Upload a vouchers CSV', function () {
            if (!issppro) {
                this.skip()
            }
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingVoucherByResellerId({ reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / voucher')
            waitPageProgressAUI()
            cy.locationShouldBe('#/voucher')
            cy.get('a[data-cy="q-btn--1"]').click()
            cy.get('input[type="file"][data-cy="upload-field"]').selectFile(path.join(fixturesFolder, 'billing_vouchers_entries.csv'), { force: 'true' })
            cy.get('div[data-cy="purge"]').click()
            cy.get('button[data-cy="aui-save-button"]').click()
            waitPageProgressAUI()
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingVoucherByResellerId({reseller_id: 1, authHeader, code: billingVoucher.code})
            })
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('td[data-cy="q-td--code"] span').contains('232').should('be.visible')
            cy.get('td[data-cy="q-td--amount"] span').contains(45).should('be.visible')

        })

        it('Delete a Billing Vouchers', function () {
            if (!issppro) {
                this.skip()
            }
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / voucher')

            cy.locationShouldBe('#/voucher')
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
            cy.get('button[data-cy="btn-confirm"]').click()
        })
    })
})