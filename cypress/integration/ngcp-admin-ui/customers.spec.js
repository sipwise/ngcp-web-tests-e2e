/// <reference types="cypress" />

import {
    apiCreateAdmin,
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateCustomer,
    apiCreateCustomerContact,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveCustomerBy,
    apiRemoveCustomerContactBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../support/ngcp-admin-ui/utils/api'

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteItemOnListPageBy,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem
} from '../../support/ngcp-admin-ui/utils/common'

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

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: null,
    external_id: 'customer' + getRandomNum(),
    contact_id: null,
    status: 'active',
    type: 'sipaccount',
    customer_id: null
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

const customerContact = {
    reseller_id: null,
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

const ngcpConfig = Cypress.config('ngcpConfig')

context('Customer tests', () => {
    context('UI customer tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            customerContact.reseller_id = id
                            apiCreateAdmin({ data: { ...mainResellerAdmin, reseller_id: id }, authHeader })
                            apiCreateBillingProfile({ data: { ...billingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                                customer.billing_profile_id = id
                            })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            customer.external_id = 'customer' + getRandomNum()
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateCustomerContact({ data: customerContact, authHeader }).then(({ id }) => {
                    apiCreateCustomer({ data: { ...customer, contact_id: id }, authHeader }).then(({ id }) => {
                        customer.customer_id = id
                    })
                })
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
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customer.email, authHeader })
            })
        })

        ;[
            {
                loginType: 'admin',
                login: ngcpConfig.username,
                password: ngcpConfig.password
            },
            {
                loginType: 'reseller',
                login: mainResellerAdmin.login,
                password: mainResellerAdmin.password
            }
        ].forEach(({ loginType, login, password }) => {
            context(`Admin login type: ${loginType}`, () => {
                it('Check if customer with invalid values gets rejected', () => {
                    cy.login(login, password)
                    cy.navigateMainMenu('settings / customer-list')

                    cy.locationShouldBe('#/customer')
                    clickToolbarActionButton('customer-creation')

                    cy.locationShouldBe('#/customer/create')
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('label[data-cy="aui-select-billing-profile"][error="true"]').should('be.visible')
                    cy.get('label[data-cy="aui-select-contact"][error="true"]').should('be.visible')
                })

                it('Create a customer', () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                        customer.external_id = 'customer' + getRandomNum()
                    })
                    cy.login(login, password)
                    cy.navigateMainMenu('settings / customer-list')

                    cy.locationShouldBe('#/customer')
                    clickToolbarActionButton('customer-creation')

                    cy.locationShouldBe('#/customer/create')
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: customerContact.email, itemContains: 'contact' })
                    cy.get('[data-cy="customer-external-id"] input').type(customer.external_id)
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: billingProfile.name, itemContains: 'profile' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it('Edit customer status to "locked"', () => {
                    cy.login(login, password)
                    cy.navigateMainMenu('settings / customer-list')

                    cy.locationShouldBe('#/customer')
                    searchInDataTable(customer.external_id, 'External #')
                    cy.get('[data-cy=aui-data-table] .q-checkbox').click()
                    clickDataTableSelectedMoreMenuItem('customerEdit')
                    waitPageProgress()

                    cy.qSelect({ dataCy: 'customer-status', filter: '', itemContains: 'Locked' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgress()
                    cy.get('[data-cy="aui-close-button"]').click()
                    waitPageProgress()
                    cy.get('[data-cy="q-td--status"]').contains('Locked')
                })

                it('Delete customer and check if they are deleted', () => {
                    cy.login(login, password)
                    cy.navigateMainMenu('settings / customer-list')

                    cy.locationShouldBe('#/customer')
                    deleteItemOnListPageBy(customer.external_id, 'External #')
                })
            })
        })
    })
})
