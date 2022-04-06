/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateCustomer,
    apiCreateCustomerContact,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
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
    deleteItemOnListPageByName,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem
} from '../../support/ngcp-admin-ui/utils/common'

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
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log(customer.customer_id)
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact.email, authHeader })
            })
        })

        it('Check if customer with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
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
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            clickToolbarActionButton('customer-creation')

            cy.locationShouldBe('#/customer/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="customer-external-id"] input').type(customer.external_id)
            cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit customer status to "locked"', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-edit')
            waitPageProgress()

            cy.qSelect({ dataCy: 'customer-status', filter: '', itemContains: 'Locked' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="q-td--status"]').contains('Locked')
        })

        it.skip('Add and remove max. subscribers from customer', () => { // Temporarily disabled due to bug: clearing field by keyboard causes error 500
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy="q-td--max-subscribers"] [data-cy^="aui-data-table-inline-edit--"]').click()
            cy.get('[data-cy="aui-data-table-edit-input--popup"] input').type('50')
            cy.contains('.q-popup-edit__buttons button', 'Save').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--max-subscribers"] span', '50').should('exist')
            cy.contains('[data-cy="q-td--max-subscribers"] span', '50').click()
            cy.get('[data-cy="aui-data-table-edit-input--popup"] input').clear() // TODO: we need to clarify why we receive error 500 from backend for empty string value
            cy.contains('.q-popup-edit__buttons button', 'Save').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--max-subscribers"] button', 'add').should('exist')
        })

        it('Add/Reset/Delete a preference (concurrent_max) in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-preferences')
            waitPageProgress()

            cy.get('[data-cy="q-item--concurrent-max"]').should('be.visible').as('concurrentMax')
            cy.get('@concurrentMax').find('input').type('500')
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@concurrentMax').find('input').should('have.value', '500')
            cy.get('@concurrentMax').contains('button[data-cy="q-icon"]', 'cancel').click()
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Save').click()
            waitPageProgress()
            cy.get('@concurrentMax').find('input').should('have.value', '')
            cy.get('@concurrentMax').find('input').type('500')
            cy.get('@concurrentMax').contains('button[data-cy="q-btn"]', 'Reset').click()
            cy.get('@concurrentMax').find('input').should('have.value', '')
        })

        it('Add/Delete a preference (allowed_clis) in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('customer-preferences')
            waitPageProgress()

            cy.get('[data-cy="q-item--allowed-clis"]').should('be.visible').as('allowedCLIs')
            cy.get('@allowedCLIs').find('input').type('test')
            cy.get('@allowedCLIs').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"]').should('contain.text', 'test')
            cy.get('@allowedCLIs').find('input').type('testtest')
            cy.get('@allowedCLIs').contains('button[data-cy="q-btn"]', 'Add').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--testtest-1"]').should('contain.text', 'testtest')
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"] i[role="presentation"][data-cy="q-icon"]').click()
            waitPageProgress()
            cy.get('@allowedCLIs').find('[data-cy="q-chip--testtest-0"]').should('be.visible')
            cy.get('@allowedCLIs').find('[data-cy="q-chip--test-0"]').should('not.exist')
        })

        it('Delete customer and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            deleteItemOnListPageByName(customer.external_id)
        })
    })
})
