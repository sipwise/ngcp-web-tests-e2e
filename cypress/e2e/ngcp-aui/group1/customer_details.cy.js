/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateCustomer,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    clickDataTableSelectedMoreMenuItem,
    getRandomNum,
    waitPageProgress,
    searchInDataTable,
    apiCreateBillingVoucher,
    apiRemoveBillingVoucherByResellerId,
    apiCreateCustomerLocation,
    apiRemoveCustomerLocationBy,
    apiCreateDomain,
    apiRemoveDomainBy,
    apiCreateCustomerContact,
    apiRemoveCustomerContactBy,
    apiRemoveCustomerBy,
    deleteItemOnListPageBy,
    apiCreateCustomerPhonebook,
    apiRemoveCustomerPhonebookBy,
    apiCreateSubscriber,
    apiRemoveSubscriberBy,
    apiCreateSoundSet,
    apiRemoveSoundSetBy,
    apiCreatePbxDeviceConfig,
    apiCreatePbxDeviceModel,
    apiCreatePbxDeviceProfile,
    apiRemovePbxDeviceProfileBy,
    apiRemovePbxDeviceConfigBy,
    apiRemovePbxDeviceModelBy,
    apiRemovePbxDeviceBy,
    apiCreatePbxDevice,
    testPreferencesTextField,
    testPreferencesToggleField
} from '../../../support/ngcp-aui/e2e'

export const billingProfile = {
    name: 'billingProfileCustomerDetails',
    handle: 'profilehandle' + getRandomNum(),
    reseller_id: 1
}

export const billingVoucher = {
    valid_until: "2026-06-05 23:59:59",
    amount: 10000,
    code: "voucherCustomerDetails",
    customer_id: 0,
    reseller_id: 1
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: null,
    external_id: 'customerDetailsTest',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount',
    customer_id: null
}

export const customerContact = {
    reseller_id: 1,
    email: 'customerDetailsContact@example.com'
}

export const customerPhonebook = {
    number: "testnumber",
    customer_id: 0,
    name: "CustomerDetailsPhonebook"
}

export const domain = {
    reseller_id: 1,
    domain: 'domainCustomerDetails'
}

export const location = {
    contract_id: 1,
    description: "description",
    blocks: [
      {
        ip: "1.1.1.1",
        mask: 16
      }
    ],
    name: "customerDetailsLocation"
}

export const pbxGroup = {
    customer_id: 0,
    display_name: 'customerDetailsPbxGroup',
    domain_id: 0,
    is_pbx_group: true,
    password: 'sub!SUB' + getRandomNum() + '#pass$',
    pbx_extension: "1",
    pbx_hunt_cancel_mode: "cancel",
    pbx_hunt_policy: "serial",
    pbx_hunt_timeout: 10,
    username: 'customerDetailsPbxGroup'
}

export const pilotSubscriber = {
    username: 'customerDetailsSubscriberCypress',
    email: 'customerDetailsSubscriberCypress@test.com',
    password: 'sub!SUB' + getRandomNum() + '#pass$',
    is_pbx_group: false,
    is_pbx_pilot: true,
    primary_number: {
        sn: 111,
        ac: 11,
        cc: 1
    },
    domain_id: 0,
    customer_id: 0
}

export const soundset = {
    reseller_id: 1,
    customer_id: 0,
    name: "customerDetailsSoundsetCypress",
    description: "testdescription",
    expose_to_customer: true,
    contract_default: true
}

const pbxDeviceConfig = {
    id: 0,
    version: "ConfigCustomerDetailsCypress",
    device_id: 0
}

const pbxDeviceProfile = {
    config_id: 0,
    name: "ProfileCustomerDetailsCypress"
}

const pbxDevice = {
    identifier: "3c28a600222e",
    profile_id: 0,
    customer_id: 0,
    station_name: "deviceCustomerDetailsCypress",
    lines: []
}

var iscloudpbx = false
var issppro = false
const ngcpConfig = Cypress.config('ngcpConfig')
const deviceModelFormData = new FormData()

context('Customer Details tests', () => {
    const pbxDeviceModel = {
    reseller_id: 1,
    bootstrap_config_http_sync_method: "GET",
    bootstrap_config_http_sync_params: "http://client.ip/admin/resync",
    bootstrap_config_http_sync_uri: "http://client.ip/admin/resync",
    bootstrap_method: "http",
    bootstrap_uri: null,
    connectable_models: [],
    extensions_num: 0,
    linerange: [
        {
        can_blf: false,
        can_forward: false,
        can_private: true,
        can_shared: false,
        can_speeddial: false,
        can_transfer: false,
        keys: [
            {
            labelpos: "top",
            x: 0,
            y: 0
            }
        ],
        name: "Phone keys",
        num_lines: 1
        }
    ],
    model: "testmodelH2PCustomerDetailsCypress",
    type: "phone",
    vendor: "ALE"
}

    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.wait('@platforminfo').then(({ response }) => {
            if (response.body.cloudpbx === true) {
                iscloudpbx = true
            }
            if (response.body.type === 'sppro') {
                issppro = true
            }
        })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            if (iscloudpbx) {
                apiRemovePbxDeviceBy({ name: pbxDevice.station_name, authHeader})
                apiRemovePbxDeviceProfileBy({ name: pbxDeviceProfile.name, authHeader})
                apiRemovePbxDeviceConfigBy({ name: pbxDeviceConfig.version, authHeader })
                apiRemovePbxDeviceModelBy({ name: pbxDeviceModel.model, authHeader })
            } else {
                cy.log("CloudPBX is not enabled, skipping device deletion...")
            }
            apiRemoveSoundSetBy({ name: soundset.name, authHeader })
            apiRemoveCustomerLocationBy({ name: location.name, authHeader })
            apiRemoveBillingVoucherByResellerId({ reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code })
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader }).then(({ id }) => {
                pilotSubscriber.domain_id = id
                pbxGroup.domain_id = id
            })
            apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                customer.billing_profile_id = id
            })
            deviceModelFormData.append("json", JSON.stringify(pbxDeviceModel))
            cy.fixture("phoneimage.png", 'base64').then((file) => {
                deviceModelFormData.append("front_image", Cypress.Blob.base64StringToBlob(file, 'image/png'), 'phoneimage.png')
            })
            cy.fixture("empty.txt").then((file) => {
                deviceModelFormData.append("mac_image", new Blob([file], { type: "text/plain" }), 'empty.txt')
                deviceModelFormData.append("front_thumbnail", new Blob([file], { type: "text/plain" }), 'empty.txt')
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiCreateCustomerContact({ data: customerContact, authHeader }).then(({ id }) => {
                apiCreateCustomer({ data: { ...customer, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateBillingVoucher({ data: { ...billingVoucher, customer_id: id }, authHeader }).then(({ id }) => billingVoucher.id = id)
                    apiCreateCustomerLocation({ data: { ...location, contract_id: id }, authHeader })
                    if (issppro) {
                        apiCreateCustomerPhonebook({ data: { ...customerPhonebook, customer_id: id }, authHeader })
                    } else {
                        cy.log("Instance is CE, not PRO. Skipping Customer Phonebook creation...")
                    }
                    apiCreateSubscriber({ data: { ...pilotSubscriber, customer_id: id }, authHeader })
                    apiCreateSubscriber({ data: { ...pbxGroup, customer_id: id }, authHeader })
                    apiCreateSoundSet({ data: { ...soundset, customer_id: id }, authHeader })
                    customer.customer_id = id
                    pbxDevice.customer_id = id
                })
            })
            if (iscloudpbx) {
                apiCreatePbxDeviceModel({ data: deviceModelFormData, authHeader}).then(({ id }) => {
                    cy.fixture("deviceconfigtestfile.xml").then((text) => {
                        apiCreatePbxDeviceConfig({ parameters: { ...pbxDeviceConfig, device_id: id }, data: text, authHeader }).then(({ id }) => {
                            pbxDeviceConfig.id = id
                            apiCreatePbxDeviceProfile({ data: { ...pbxDeviceProfile, config_id: id }, authHeader }).then(({ id }) => {
                                apiCreatePbxDevice({ data: { ...pbxDevice, profile_id: id }, authHeader })
                            })
                        })
                    })
                })
            } else {
                cy.log("CloudPBX is not enabled, skipping device creation...")
            }
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    afterEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            if (iscloudpbx) {
                apiRemovePbxDeviceBy({ name: pbxDevice.station_name, authHeader})
                apiRemovePbxDeviceProfileBy({ name: pbxDeviceProfile.name, authHeader})
                apiRemovePbxDeviceConfigBy({ name: pbxDeviceConfig.version, authHeader })
                apiRemovePbxDeviceModelBy({ name: pbxDeviceModel.model, authHeader })
            } else {
                cy.log("CloudPBX is not enabled, skipping device deletion...")
            }
            apiRemoveSoundSetBy({ name: soundset.name, authHeader })
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pilotSubscriber.username, authHeader })

            if (issppro) {
                apiRemoveCustomerPhonebookBy({ name: customerPhonebook.name, authHeader })
            } else {
                cy.log("Instance is CE, not PRO. Skipping Customer Phonebook deletion...")
            }
            apiRemoveCustomerLocationBy({ name: location.name, authHeader })
            apiRemoveBillingVoucherByResellerId({ reseller_id: billingVoucher.reseller_id, authHeader, code: billingVoucher.code })
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
        })
    })

    context('Contact Details', () => {
        it('Edit contact settings to see if changes display in customer details', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / contact')

            cy.locationShouldBe('#/contact')

            searchInDataTable(customerContact.email)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('contactEdit')

            cy.get('input[data-cy="firstname-field"]').type('Firstname')
            cy.get('input[data-cy="lastname-field"]').type('Lastname')
            cy.get('input[data-cy="company-field"]').type('testcompany')
            cy.get('input[data-cy="phone-num-field"]').type('123456789')
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Contact Details').click()
            cy.get('div[data-cy="customer-contactdetails-table"]').contains('Firstname Lastname').should('be.visible')
            cy.get('div[data-cy="customer-contactdetails-table"]').contains('testcompany').should('be.visible')
            cy.get('div[data-cy="customer-contactdetails-table"]').contains('123456789').should('be.visible')
        })

    })

    context('Contract Balance, Top-up Log and Balance Intervals', () => {
        it('Set contract cash balance and check log & balance', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Contract Balance').click()
            cy.get('a[data-cy="customer-contractbalance-setcashbalance"]').click()
            cy.get('input[data-cy="cash-balance"]').clear().type('100')
            cy.get('input[data-cy="free_time_balance"]').clear().type('50')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('div[data-cy="customer-contractbalance-cashbalance-value"]').contains('100').should('be.visible')
            cy.get('div[data-cy="customer-contractbalance-freetimebalance-value"]').contains('50').should('be.visible')
            cy.get('div').contains('Top-up Log').click()
            cy.get('td[data-cy="q-td--type"]').contains('set_balance').should('be.visible')
            cy.get('td[data-cy="q-td--outcome"]').contains('ok').should('be.visible')
            cy.get('td[data-cy="q-td--amount"]').contains('100').should('be.visible')
            cy.get('div').contains('Balance Intervals').click()
            cy.get('td[data-cy="q-td--cash-balance"]').contains('100.00').should('be.visible')
            cy.get('td[data-cy="q-td--free-time-balance"]').contains('50').should('exist')
        })

        it('Use Top up Voucher and check log & balance', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Contract Balance').click()
            cy.get('a[data-cy="customer-contractbalance-topupvoucher"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-voucher', filter: billingVoucher.code, itemContains: billingVoucher.code })
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('div').contains('Top-up Log').click()
            cy.get('td[data-cy="q-td--type"]').contains('voucher').should('be.visible')
            cy.get('td[data-cy="q-td--outcome"]').contains('ok').should('be.visible')
            cy.get('td[data-cy="q-td--amount"]').contains('100').should('be.visible')
            cy.get('div').contains('Balance Intervals').click()
            cy.get('td[data-cy="q-td--cash-balance"]').contains('100.00').should('be.visible')
        })

        it('Use Top up Cash and check log & balance', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Contract Balance').click()
            cy.get('a[data-cy="customer-contractbalance-setcashbalance"]').click()
            cy.get('input[data-cy="cash-balance"]').clear().type('1')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('a[data-cy="customer-contractbalance-topupcash"]').click()
            cy.get('input[data-cy="top-up-amount"]').type(10000)
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('div[data-cy="customer-contractbalance-cashbalance-value"]').find('div[class="q-item__label text-default"]').contains('101').should('be.visible')
            cy.get('div').contains('Top-up Log').click()
            cy.get('td[data-cy="q-td--type"]').contains('cash').should('be.visible')
            cy.get('td[data-cy="q-td--outcome"]').contains('ok').should('be.visible')
            cy.get('td[data-cy="q-td--amount"]').contains('100').should('be.visible')
            cy.get('div').contains('Balance Intervals').click()
            cy.get('td[data-cy="q-td--cash-balance"]').contains('101.00').should('be.visible')
        })
    })

    context('Fraud Limits', () => {
        it('Try to edit Fraud limits with invalid values', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Fraud Limits').click()
            cy.get('button[data-cy="aui-customerfraudlimits-email-add-button"]:first').click()
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"]:first').type('invalidmail')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-customerfraudlimits-notify-email"]:first').find('div[role="alert"]').contains('Input must be a valid email address').should('be.visible')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"]:first').clear().type('testmail@mail.com')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail@mail.com"]').should('not.exist')
        })

        it('Add/Delete/Reset fraud limits and emails to customer details', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Fraud Limits').click()
            cy.get('input[data-cy="customer-fraud-limit"]:first').type('100')
            cy.get('button[data-cy="aui-customerfraudlimits-email-add-button"]:first').click()
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"]:first').type('testmail@template.com')
            cy.get('input[data-cy="customer-fraud-limit"]:last').type('200')
            cy.get('button[data-cy="aui-customerfraudlimits-email-add-button"]:last').click()
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"]:last').type('testmail2@template.com')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('input[data-cy="customer-fraud-limit"][value="100"]').should('be.visible')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail@template.com"]').should('be.visible')
            cy.get('input[data-cy="customer-fraud-limit"][value="200"]').should('be.visible')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail2@template.com"]').should('be.visible')
            cy.get('input[data-cy="customer-fraud-limit"]:first').type('500')
            cy.get('input[data-cy="customer-fraud-limit"]:last').type('1000')
            cy.get('button[data-cy="aui-customerfraudlimits-notify-email-delete"]:first').click()
            cy.get('button[data-cy="aui-customerfraudlimits-notify-email-delete"]:last').click()
            cy.get('button[data-cy="aui-reset-button"]').click()
            cy.get('input[data-cy="customer-fraud-limit"][value="100"]').should('be.visible')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail@template.com"]').should('be.visible')
            cy.get('input[data-cy="customer-fraud-limit"][value="200"]').should('be.visible')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail2@template.com"]').should('be.visible')
            cy.get('button[data-cy="aui-customerfraudlimits-notify-email-delete"]:first').click()
            cy.get('button[data-cy="aui-customerfraudlimits-notify-email-delete"]').click()
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail@template.com"]').should('not.exist')
            cy.get('input[data-cy="aui-customerfraudlimits-notify-email"][value="testmail2@template.com"]').should('not.exist')
        })
    })

    context('Locations', () => {
        it('Try to create location with invalid values', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Locations').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="location-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="location-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="location-ip"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="location-ip"]').type('testip')
            cy.get('input[data-cy="locationblock-mask"]').type('ts')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="location-ip"]').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')
            cy.get('label[data-cy="locationblock-mask"]').find('div[role="alert"]').contains('Input must be a valid number').should('be.visible')
        })

        it('Create a location', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerLocationBy({ name: location.name, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Locations').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('input[data-cy="location-name"]').type(location.name)
            cy.get('input[data-cy="location-description"]').type(location.description)
            cy.get('input[data-cy="location-ip"]').type(location.blocks[0].ip)
            cy.get('input[data-cy="locationblock-mask"]').type(location.blocks[0].mask)
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('td[data-cy="q-td--name"]').contains(location.name).should('be.visible')
            cy.get('td[data-cy="q-td--description"]').contains(location.description).should('be.visible')
            cy.get('td[data-cy="q-td--blocks-grp"]').contains(location.blocks[0].ip + "/" + location.blocks[0].mask).should('be.visible')
        })

        it('Edit a location', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Locations').click()
            waitPageProgress()
            searchInDataTable(location.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerLocationEdit"]').click()
            cy.get('input[data-cy="location-description"]').clear().type('testdescription')
            cy.get('button[data-cy="location-block-add"]').click()
            cy.get('input[data-cy="location-ip"]:last').type('192.168.1.1')
            cy.get('input[data-cy="locationblock-mask"]:last').type('24')
            cy.get('button[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--description"]').contains('testdescription').should('be.visible')
            cy.get('td[data-cy="q-td--blocks-grp"]').contains("192.168.1.1/24").should('be.visible')
            cy.get('td[data-cy="q-td--blocks-grp"]').contains(location.blocks[0].ip + "/" + location.blocks[0].mask).should('be.visible')
        })

        it('Delete a location', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div').contains('Locations').click()
            waitPageProgress()
            deleteItemOnListPageBy(location.name, 'All')
        })
    })

    context('PBX Groups', () => {
        it('Try to create pbx group with invalid values', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Groups').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="pbxgroup-display_name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="pbxgroup-pbx_extension"]').find('div[role="alert"]').contains('Input is required').should('be.visible')                
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

        it('Create a pbx group', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader})
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Groups').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="pbxgroup-display_name"]').type(pbxGroup.display_name)
                cy.get('input[data-cy="pbxgroup-pbx_extension"]').type(pbxGroup.pbx_extension)
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--display-name"]').contains(pbxGroup.display_name).should('be.visible')
                cy.get('td[data-cy="q-td--pbx-extension"]').contains(pbxGroup.pbx_extension).should('be.visible')                
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

        it('Edit a pbx group', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Groups').click()
                waitPageProgress()
                searchInDataTable(pbxGroup.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsPbxGroupEdit"]').click()
                cy.get('input[data-cy="pbxgroup-pbx_hunt_timeout"]').clear().type('5')
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--pbx-hunt-timeout"]').contains(5).should('be.visible')                
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

       it('Delete a pbx group', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Groups').click()
                waitPageProgress()
                deleteItemOnListPageBy(pbxGroup.username, 'Name')                
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })
    })

    context('PBX Devices', () => {
        it('Try to create PBX device with invalid values', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Devices').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="pbx-profile-id"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="pbx-identifier"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="pbx-station-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

        it('Create a PBX device', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceBy({ name: pbxDevice.station_name, authHeader})
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Devices').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'pbx-profile-id', filter: pbxDeviceModel.model, itemContains: pbxDeviceModel.model })
                cy.get('input[data-cy="pbx-identifier"]').type(pbxDevice.identifier)
                cy.get('input[data-cy="pbx-station-name"]').type(pbxDevice.station_name)
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--station-name"]').contains(pbxDevice.station_name).should('be.visible')
                cy.get('td[data-cy="q-td--identifier"]').contains(pbxDevice.identifier).should('be.visible')
                cy.get('td[data-cy="q-td--profile"]').contains(pbxDeviceProfile.name).should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

        it('Add subscriber to PBX device', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Devices').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsPbxDeviceEdit"]').click()
                cy.get('div[class="button"]').contains('1').click()
                cy.auiSelectLazySelect({ dataCy: 'pbx-device-subscriber', filter: '', itemContains: pilotSubscriber.username })
                cy.get('button[data-cy="pbx-device-close"]').click()
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[class="button"]').contains('1').click()
                cy.get('label[data-cy="pbx-device-subscriber"] span').contains(pilotSubscriber.username).should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

        it('Test all PBX device preferences', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Devices').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsPbxDevicePreferences"]').click()
                waitPageProgress()
                testPreferencesToggleField('DNS_SRV_enable')
                testPreferencesTextField('admin_name', 'admin', false)
                testPreferencesTextField('admin_pass', 'admin', false)
                testPreferencesTextField('ntp_server', 'testserver.com', false)
                testPreferencesTextField('ntp_sync', 10, true)
                testPreferencesTextField('syslog_level', 5, true)
                testPreferencesTextField('syslog_server', 'testserver.com', false)
                testPreferencesToggleField('user_conf_priority')
                testPreferencesToggleField('web_gui_dis')
                testPreferencesToggleField('FW_upg_dis')
                testPreferencesToggleField('vnd_Panasonic_FW_autoupg_dis')
                testPreferencesTextField('vnd_Panasonic_FW_ver', '1.232.4', false)
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })

       it('Delete a PBX device', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div').contains('PBX Devices').click()
                waitPageProgress()
                deleteItemOnListPageBy(pbxDevice.station_name, 'Station Name')
            } else {
                cy.log('CloudPBX is not enabled, skipping PBX group tests...')
            }
        })
    })

    context('Phonebook', () => {
        it('Try to create phonebook entry with invalid values', () => {
            if (issppro) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
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
                    apiRemoveCustomerPhonebookBy({ name: customerPhonebook.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="phonebook-name"]').type(customerPhonebook.name)
                cy.get('input[data-cy="phonebook-number"]').type(customerPhonebook.number)
                cy.get('button[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"]').contains(customerPhonebook.name).should('be.visible')
                cy.get('td[data-cy="q-td--number"]').contains(customerPhonebook.number).should('be.visible')                
            } else {
                cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
            }
        })

        it('Edit a phonebook', () => {
            if (issppro) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                waitPageProgress()
                searchInDataTable(customerPhonebook.name, 'Name')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsPhonebookEntryEdit"]').click()
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
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                waitPageProgress()
                deleteItemOnListPageBy(customerPhonebook.name, 'Name')                
            } else {
                cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
            }
        })
    })

    context('Resellers', () => {
        it('Check if reseller values are correct', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Reseller').click()
            cy.get('td[class="text-left"]').contains(billingVoucher.reseller_id).should('be.visible')
            cy.get('td[class="text-left"]').contains('default').should('be.visible')
            cy.get('td[class="text-left"]').contains('active').should('be.visible')
        })
    })

    context('Soundsets', () => {
        it('Check if soundset with invalid values gets rejected', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Sound Sets').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('label[data-cy="soundsets-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log("CloudPBX is not enabled, skipping PBX group tests...")
            }
        })

        it('Create a soundset, check if its applied to subscriber', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSoundSetBy({ name: soundset.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Sound Sets').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="soundsets-name"]').type(soundset.name)
                cy.get('input[data-cy="soundsets-description"]').type(soundset.description)
                cy.get('div[data-cy="soundsets-expose_to_customer"]').click()
                cy.get('div[data-cy="soundsets-default_for_subscribers"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"]').contains(soundset.name).should('exist')
                cy.get('td[data-cy="q-td--description"]').contains(soundset.description).should('exist')
                cy.get('td[data-cy="q-td--expose-to-customer"]').find('div[aria-checked="true"]').should('exist')
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Subscribers').click()
                waitPageProgress()
                searchInDataTable(pilotSubscriber.username, 'Username')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberPreferences"]').click()
                waitPageProgress()
                cy.get('input[aria-label="Search"]').type('contract_sound_set')
                cy.get('input[aria-label="Customer Sound Set"]').parents('label').find('span').contains(soundset.name).should('be.visible')
            } else {
                cy.log("CloudPBX is not enabled, skipping PBX group tests...")
            }

        })

        it('Edit a soundset', () => {
            if(iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Sound Sets').click()
                waitPageProgress()
                searchInDataTable(soundset.name)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSoundSetEdit"]').click()
                cy.get('input[data-cy="soundsets-description"]').clear().type('testDescription')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--name"]').contains(soundset.name).should('exist')
                cy.get('td[data-cy="q-td--description"]').contains('testDescription').should('exist')
                cy.get('td[data-cy="q-td--expose-to-customer"]').find('div[aria-checked="true"]').should('exist')
            } else {
                cy.log("CloudPBX is not enabled, skipping PBX group tests...")
            }
        })

        it('Delete Soundset', () => {
            if(iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / customer', false)
                cy.locationShouldBe('#/customer')
                searchInDataTable(customer.external_id, 'External #')
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Sound Sets').click()
                waitPageProgress()
                deleteItemOnListPageBy(soundset.name)
            } else {
                cy.log("CloudPBX is not enabled, skipping PBX group tests...")
            }
        })
    })

    context('Subscribers', () => {
        it('Check if add page redirect to correct page', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Subscribers').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('label[data-cy="aui-select-domain"]').should('exist')
            cy.get('label[data-cy="aui-input-subscriber-username"]').should('exist')
            cy.get('label[data-cy="subscriber-sip-username"]').should('exist')
            cy.get('label[data-cy="subscriber-sip-password"]').should('exist')
            cy.get('label[data-cy="subscriber-web-username"]').should('exist')
            cy.get('label[data-cy="subscriber-web-password"]').should('exist')
        })

        it('Check if edit page contents are correct', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Subscribers').click()
            waitPageProgress()
            searchInDataTable(pilotSubscriber.username, 'Username')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerSubscriberEdit"]').click()
            cy.get('label[data-cy="aui-select-domain"] span').contains(domain.domain).should('be.visible')
            cy.get('input[data-cy="subscriber-email"][value="' + pilotSubscriber.email + '"').should('be.visible')
            cy.get('input[data-cy="subscriber-sip-username"][value="' + pilotSubscriber.username + '"]').should('be.visible')
            cy.get('input[data-cy="subscriber-sip-password"][value="' + pilotSubscriber.password + '"]').should('be.visible')
            cy.get('input[data-cy="subscriber-web-username"][value="' + pilotSubscriber.username + '"]').should('be.visible')
        })

        it('Delete subscriber', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer', false)
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetails"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Subscribers').click()
            waitPageProgress()
            deleteItemOnListPageBy(pilotSubscriber.username, 'Username')
        })
    })
})
