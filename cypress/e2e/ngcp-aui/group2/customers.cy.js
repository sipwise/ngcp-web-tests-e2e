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
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiRemoveCustomerContactsByIds,
    apiRemoveCustomerById,
} from '../../../support/e2e'

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'customersContract',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const mainResellerAdmin = {
    login: 'testAdminCustomers',
    password: 'rand0mpassword12345',
    role: 'reseller',
    is_master: true,
    is_active: true,
    show_passwords: true,
    call_data: true,
    billing_data: true,
    reseller_id: null
}

const billingProfile = {
    name: 'profileCustomers',
    handle: 'profilehandle' + getRandomNum(),
    reseller_id: null
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerCypress',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactTestCustomers@example.com'
}

const randomNumber = getRandomNum()
const ngcpConfig = Cypress.config('ngcpConfig')

context('Customer tests', () => {
    const customer = {
        billing_profile_definition: 'id',
        billing_profile_id: null,
        external_id: 'test' + randomNumber,
        contact_id: null,
        status: 'active',
        type: 'sipaccount',
        customer_id: null
    }

    const customerContact = {
        id : null,
        reseller_id: null,
        email: 'customerContact' + randomNumber +'@'+ 'example.com',
    }

    const customerContactIdsToRemove = []

    context('UI customer tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: mainResellerAdmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                cy.log('Data clean up pre-tests completed')

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
            if (customer.customer_id === null) {
                apiLoginAsSuperuser().then(authHeader => {
                    // Here we are creating multiple contacts with the same email because
                    // we only need the id to create a customer. We delete the mall in after()
                    apiCreateCustomerContact({ data: customerContact, authHeader }).then(({ id }) => {
                        customerContactIdsToRemove.push(id)
                        customerContact.id = id
                        customer.contact_id = id
                        apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                            customer.customer_id = id
                        })
                    })

                })
            }

            cy.log('Skipped beforeEach()')
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: mainResellerAdmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                // Customer contacts are considered locked when linked to an active customer.
                // We remove all of the, at the end to give the time to the dbs to update the
                // customer state of deleted items to "terminated"
                apiRemoveCustomerContactsByIds({ids: customerContactIdsToRemove, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            if (customer.customer_id !== null) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCustomerById({ id: customer.customer_id, authHeader })
                    customer.customer_id = null
                })
            }

            cy.log('Skipped afterEach()')
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
                    cy.quickLogin(login, password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    cy.get('a[data-cy="aui-list-action--add"]').click()

                    cy.locationShouldBe('#/customer/create')
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('input[data-cy="aui-select-billing-profile"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('input[data-cy="aui-select-contact"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                })

                it('Create a customer', () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveCustomerById({ id: customer.customer_id, authHeader })
                        customer.external_id = 'newCustomer' + getRandomNum()
                    })
                    cy.quickLogin(login, password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    cy.get('a[data-cy="aui-list-action--add"]').click()

                    cy.locationShouldBe('#/customer/create')
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: customerContact.email, itemContains: randomNumber })
                    cy.get('input[data-cy="customer-external-id"]').type(customer.external_id)
                    cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: billingProfile.name, itemContains: 'profile' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it('Edx customer status to "locked"', () => {
                    cy.quickLogin(login, password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    searchInDataTable(customer.external_id, 'External #')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--customerEdit"]').click()
                    waitPageProgressAUI()

                    cy.qSelect({ dataCy: 'customer-status', filter: '', itemContains: 'Locked' })
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgressAUI()
                    cy.get('[data-cy="aui-close-button"]').click()
                    waitPageProgressAUI()
                    cy.get('span[data-cy="aui-data-table-inline-edit--select"] span').contains('Locked')
                })

                it('Delete customer and check if they are deleted', () => {
                    cy.quickLogin(login, password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    deleteItemOnListPageBy(customer.external_id, 'External #')
                })
            })
        })
    })
})
