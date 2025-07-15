/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateResellerPhonebook,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveResellerPhonebookBy,
    apiRemoveSystemContactBy,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiRemoveAdminBy,
    apiRemoveDomainBy,
    apiCreateBillingNetwork,
    apiRemoveBillingNetworkBy,
    apiRemoveBillingProfileBy,
    apiRemoveCustomerBy,
    apiCreateCustomerContact,
    apiRemoveCustomerContactBy,
    apiCreateBillingProfile,
    apiCreateAdmin,
    apiCreateCustomer,
    apiCreateDomain
} from '../../../support/ngcp-aui/e2e'

const billingProfile = {
    name: 'billingProfileCypress',
    handle: 'profilehandle1',
    reseller_id: null
}

const internalBillingProfile = {
    name: 'internalBillingProfileCypress',
    handle: 'internalProfilehandle1',
    reseller_id: null
}

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractResellerTest',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 0,
    external_id: 'resellerDetailsCustomer',
    contact_id: 0,
    status: 'active',
    type: 'sipaccount',
    customer_id: null
}

const customerContact = {
    id : null,
    reseller_id: null,
    email: 'ResellerDetailsContact@example.com',
}

const domain = {
    id: 0,
    reseller_id: 1,
    domain: 'resellerDetailsDomain'
}

const testadmin = {
    login: 'resellerDetailsAdmin',
    password: 'Rand0m#pAssw#O1234#',
    role: 'admin',
    is_master: false,
    is_active: true,
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'resellerDetailsReseller',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContact@example.com',
    firstname: 'Testfirstname',
    lastname: 'Testlastname'
}

export const resellerPhonebook = {
    number: "testnumber",
    reseller_id: 0,
    name: "ResellerDetailsPhonebook"
}

const billingNetwork = {
  blocks: [
    {
      ip: "1.1.1.1",
      mask: 16
    },
    {
      ip: "2.2.2.2",
      mask: 16
    }
  ],
  description: "billingNetworkDescription",
  reseller_id: 0,
  name: "billingNetworkName"
}

let iscloudpbx = false
let issppro = null
const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller tests', () => {
    context('UI reseller tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                iscloudpbx = response.body.cloudpbx === true
                issppro = response.body.type === 'sppro'
            })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                if (issppro) {
                    apiRemoveResellerPhonebookBy({ name: resellerPhonebook.name, authHeader })
                }
                apiRemoveBillingProfileBy({ name: internalBillingProfile.name, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader })
                apiRemoveAdminBy({ name: testadmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    contract.contact_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                if (issppro) {
                    apiRemoveResellerPhonebookBy({ name: resellerPhonebook.name, authHeader })
                }
                apiRemoveBillingProfileBy({ name: internalBillingProfile.name, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader})
                apiRemoveAdminBy({ name: testadmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })

                cy.log('Seeding up db...')
                apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        if (issppro) {
                            apiCreateResellerPhonebook({ data: { ...resellerPhonebook, reseller_id: id }, authHeader })
                        }
                        apiCreateAdmin({ data: { ...testadmin, reseller_id: id }, authHeader })
                        apiCreateBillingNetwork({ data: { ...billingNetwork, reseller_id: id }, authHeader })
                        apiCreateBillingProfile({ data: { ...billingProfile, reseller_id: id }, authHeader })
                        apiCreateBillingProfile({ data: { ...internalBillingProfile, reseller_id: id }, authHeader }).then(({ id }) => {
                            customer.billing_profile_id = id
                        })
                        apiCreateCustomerContact({ data: { ...customerContact, reseller_id: id }, authHeader }).then(({ id }) => {
                            apiCreateCustomer({ data: { ...customer, contact_id: id }, authHeader })
                        })
                        apiCreateDomain({ data: { ...domain, reseller_id: id }, authHeader }).then(({ id }) => {
                            domain.id = id
                        })
                    })
                })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                if (issppro) {
                    apiRemoveResellerPhonebookBy({ name: resellerPhonebook.name, authHeader })
                }
                apiRemoveBillingProfileBy({ name: internalBillingProfile.name, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: testadmin.login, authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader })
                apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader})
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            })
        })

        context('Administrator', () => {
            it('Try to create an administrator with invalid values', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Administrator Logins').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="aui-select-reseller"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="login-field"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="password-field"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="password-retype-field"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create an administrator', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveAdminBy({ name: testadmin.login, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Administrator Logins').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()

                cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
                cy.get('input[data-cy="login-field"] ').type(testadmin.login)
                cy.get('input[data-cy="password-field"] ').type(testadmin.password)
                cy.get('input[data-cy="password-retype-field"] ').type(testadmin.password)
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"]').contains(testadmin.login).should('be.visible')

            })

            it('Enable read only. Check if read only is enabled', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Administrator Logins').click()
                searchInDataTable(testadmin.login)
                cy.get('td[data-cy="q-td--read-only"]').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--read-only"]').find('div[role="switch"][aria-checked="true"]').should('be.visible')
                cy.logoutUI()
                cy.wait(500)
                cy.loginUI(testadmin.login, testadmin.password, false)
                cy.navigateMainMenu('settings / reseller', false)
                cy.get('a[data-cy="aui-list-action--add"]').should('not.exist')
                cy.get('a[data-cy="aui-list-action--edit-menu-btn"]').should('not.exist')
                cy.get('a[data-cy="aui-list-action--delete"]').should('not.exist')
            })

            it('Delete administrator', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Administrator Logins').click()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--delete"]').click()
                cy.get('[data-cy="btn-confirm"]').click()
                cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
            })
        })

        context('Billing Network', () => {
            it('Try to create a billing network with invalid values', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Networks').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="billingnetworks-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="billingnetworks-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="billingnetworks-name"]').type(billingNetwork.name)
                cy.get('label[data-cy="billingnetworks-description"]').type(billingNetwork.description)
                cy.get('label[data-cy="billingnetworks-ip"]').type('invalidip')
                cy.get('label[data-cy="billingnetworks-mask"]').type('badmask')
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')
                cy.get('label[data-cy="billingnetworks-mask"]').find('div[role="alert"]').contains('Input must be no longer than 3 characters').should('be.visible')
                cy.get('label[data-cy="billingnetworks-ip"]').clear().type('123.421.123.80')
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')
            })

            it('Create a billing network', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader})
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Networks').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('label[data-cy="billingnetworks-name"]').type(billingNetwork.name + "2")
                cy.get('label[data-cy="billingnetworks-description"]').type(billingNetwork.description)
                cy.get('label[data-cy="billingnetworks-ip"]').type(billingNetwork.blocks[0].ip)
                cy.get('label[data-cy="billingnetworks-mask"]').type(billingNetwork.blocks[0].mask)
                cy.get('button[data-cy="billingnetworks-newblock"]').click()
                cy.get('label[data-cy="billingnetworks-ip"]:last').type(billingNetwork.blocks[1].ip)
                cy.get('label[data-cy="billingnetworks-mask"]:last').type(billingNetwork.blocks[1].mask)
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"]').contains(billingNetwork.name).should('be.visible')
                cy.get('td[data-cy="q-td--blocks-grp"]').contains(billingNetwork.blocks[0].ip + '/' + billingNetwork.blocks[0].mask + ', ' + billingNetwork.blocks[1].ip + '/' + billingNetwork.blocks[1].mask).should('be.visible')
            })

            it('Edit a billing network', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Networks').click()
                searchInDataTable(billingNetwork.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetailsBillingNetworkEdit"]').click()
                waitPageProgress()
                cy.get('input[data-cy="billingnetworks-ip"]:last').clear().type('3.3.3.3')
                cy.get('input[data-cy="billingnetworks-mask"]:last').clear().type('16')
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--blocks-grp"]').contains('3.3.3.3/16').should('be.visible')
            })

            it('Delete a billing network', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Networks').click()
                deleteItemOnListPageBy(billingNetwork.name)
            })
        })

        context('Billing Profile', () => {
            it('Try to create a billing profile with invalid values', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Profiles').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="billingprofiles-handle"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="billingprofiles-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create a billing profile', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Profiles').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="billingprofiles-handle"]').type(billingProfile.handle)
                cy.get('input[data-cy="billingprofiles-name"]').type(billingProfile.name)
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"]').contains(billingProfile.name).should('be.visible')

            })

            it('Enable and disable prepaid', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Profiles').click()
                searchInDataTable(billingProfile.name)
                cy.get('td[data-cy="q-td--prepaid"]').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--prepaid"]').find('div[role="switch"][aria-checked="true"]').should('be.visible')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetailsBillingProfileEdit"]').click()
                waitPageProgress()
                cy.get('div[data-cy="billingprofiles-prepaid"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--prepaid"]').find('div[role="switch"][aria-checked="false"]').should('be.visible')
            })

            it('Delete billing profile', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Billing Profiles').click()
                deleteItemOnListPageBy(billingProfile.name)
            })
        })

        context('Branding', () => {
            it('Change branding color', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Branding').click()
                waitPageProgress()
                cy.get('[data-cy="color-picker"]:first').click()
                cy.get('div[class="q-color-picker"]').should('be.visible')
                cy.get('input[data-cy="csc-font-color"]').click()
                cy.get('div[class="q-color-picker"]').should('not.exist')
                cy.get('label[data-cy="csc-font-color"]').clear().type('rgba(0,0,0,1)')
                cy.get('[data-cy="color-picker"]:last').click()
                cy.get('div[class="q-color-picker"]').should('be.visible')
                cy.get('input[data-cy="csc-background-color"]').click()
                cy.get('div[class="q-color-picker"]').should('not.exist')
                cy.get('label[data-cy="csc-background-color"]').clear().type('rgba(0,110,0,1)')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.contains('.q-notification', 'Branding changed successfully').should('be.visible')
            })
        })

        context('Customer', () => {
            it('Check if customer with invalid values gets rejected', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Customers').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('input[data-cy="aui-select-billing-profile"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('input[data-cy="aui-select-contact"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create a customer', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Customers').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: customerContact.email, itemContains: customerContact.email })
                cy.get('input[data-cy="customer-external-id"]').type(customer.external_id)
                cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: billingProfile.name, itemContains: billingProfile.name })
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Edit customer status to "locked"', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Customers').click()
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetailsCustomerEdit"]').click()
                waitPageProgress()
                cy.qSelect({ dataCy: 'customer-status', filter: '', itemContains: 'Locked' })
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                waitPageProgress()
                cy.get('span[data-cy="aui-data-table-inline-edit--select"] span').contains('Locked')
            })

            it('Delete customer and check if they are deleted', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Customers').click()

                deleteItemOnListPageBy(customer.external_id, 'External #')
            })
        })

        context('Domain', () => {
            it('Check if domain with invalid values gets rejected', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Domains').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('input[data-cy="domain-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })
    
            it('Create a domain', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveDomainBy({ name: domain.domain, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Domains').click()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="domain-name"]').type(domain.domain)
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Check if clicking "Preferences" redirects to correct URL', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Domains').click()
                searchInDataTable(domain.domain)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--domainPreferences"]').click()
                cy.get('div[data-cy="q-item--allowed-ips"]').should('be.visible')
            })

            it('Delete domain', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Domains').click()
                deleteItemOnListPageBy(domain.domain)
            })
        })

        context('Phonebook', () => {
            it('Try to create phonebook entry with invalid values', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / reseller', false)

                    cy.locationShouldBe('#/reseller')
                    searchInDataTable(reseller.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    waitPageProgress()
                    cy.get('a[data-cy="aui-list-action--add"]').click()
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('label[data-cy="phonebook-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('label[data-cy="phonebook-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Create a phonebook', () => {
                if (issppro) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveResellerPhonebookBy({name: resellerPhonebook.name, authHeader})
                    })
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / reseller', false)

                    cy.locationShouldBe('#/reseller')
                    searchInDataTable(reseller.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    waitPageProgress()
                    cy.get('a[data-cy="aui-list-action--add"]').click()
                    cy.get('input[data-cy="phonebook-name"]').type(resellerPhonebook.name)
                    cy.get('input[data-cy="phonebook-number"]').type(resellerPhonebook.number)
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('td[data-cy="q-td--name"]').contains(resellerPhonebook.name).should('be.visible')
                    cy.get('td[data-cy="q-td--number"]').contains(resellerPhonebook.number).should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Edit a phonebook', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / reseller', false)

                    cy.locationShouldBe('#/reseller')
                    searchInDataTable(reseller.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    waitPageProgress()
                    searchInDataTable(resellerPhonebook.name, 'Name')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--resellerDetailsPhonebookEntryEdit"]').click()
                    cy.get('input[data-cy="phonebook-number"]').clear().type('anothertestnumber')
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('[data-cy="aui-close-button"]').click()
                    cy.get('td[data-cy="q-td--number"]').contains('anothertestnumber').should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Delete a phonebook', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / reseller', false)

                    cy.locationShouldBe('#/reseller')
                    searchInDataTable(reseller.name)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    waitPageProgress()
                    deleteItemOnListPageBy(resellerPhonebook.name, 'Name')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })
        })

        context('Information', () => {
            it('Check if reseller, reseller contract and reseller contact info are correct', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller', false)

                cy.locationShouldBe('#/reseller')
                searchInDataTable(reseller.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--resellerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Reseller Base Information').click()
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(reseller.name).should('be.visible')
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(reseller.status).should('be.visible')
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Reseller Contact').click()
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(systemContact.firstname).should('be.visible')
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(systemContact.lastname).should('be.visible')
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(systemContact.email).should('be.visible')
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Reseller Contract').click()
                cy.get('div[data-cy="aui-single-row-table--0"] td').contains(contract.external_id).should('be.visible')
            })
        })
    })
})
