/// <reference types="cypress" />

import {
    apiCreateBillingProfile,
    apiCreateContract,
    apiCreateCustomer,
    apiCreateCustomerContact,
    apiCreateEmergencyMappingContainer,
    apiCreateNCOSLevel,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveBillingProfileBy,
    apiRemoveContractBy,
    apiRemoveCustomerBy,
    apiRemoveCustomerContactBy,
    apiRemoveEmergencyMappingContainerBy,
    apiRemoveNCOSLevelBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../support/ngcp-admin-ui/utils/api'

import {
    getRandomNum,
    waitPageProgress,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem,
    testPreferencesChipField,
    testPreferencesListField,
    testPreferencesTextField,
    testPreferencesToggleField
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

const emergencyMappingContainer = {
    name: 'emergency' + getRandomNum(),
    reseller_id: null
}

const ncosLevel = {
    reseller_id: null,
    level: 'ncoslevel' + getRandomNum(),
    mode: 'whitelist',
    description: 'description' + getRandomNum()
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Customer preferences tests', () => {
    context('UI customer preferences tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            customerContact.reseller_id = id
                            apiCreateEmergencyMappingContainer({ data: { ...emergencyMappingContainer, reseller_id: id }, authHeader })
                            apiCreateNCOSLevel({ data: { ...ncosLevel, reseller_id: id }, authHeader })
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
                apiRemoveNCOSLevelBy({ name: ncosLevel.level, authHeader })
                apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
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

        it('Test all Access Restricion settings in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', itemContains: 'Access Restrictions' })
            testPreferencesChipField('allowed_clis"]')
            testPreferencesListField('allowed_clis_reject_policy', 'Force CLIR')
            testPreferencesTextField('allowed_ips_header')
            testPreferencesListField('calllist_clir_scope', 'External')
            testPreferencesTextField('concurrent_max', 123, true)
            testPreferencesTextField('concurrent_max_in', 123, true)
            testPreferencesTextField('concurrent_max_in_total', 123, true)
            testPreferencesTextField('concurrent_max_out', 123, true)
            testPreferencesTextField('concurrent_max_out_total', 123, true)
            testPreferencesTextField('concurrent_max_total', 123, true)
            testPreferencesTextField('max_call_duration', 123)
        })

        it('Test all Application settings in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', itemContains: 'Applications' })
            testPreferencesToggleField('malicious_call_identification')
            testPreferencesToggleField('party_call_control')
            testPreferencesToggleField('play_announce_before_call_setup')
            testPreferencesListField('play_announce_before_recording', 'External calls only')
            testPreferencesToggleField('play_announce_to_callee')
            testPreferencesToggleField('play_emulated_ringback_tone')
        })

        it('Test all Call Blocking settings in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', itemContains: 'Call Blockings' })
            testPreferencesToggleField('adm_block_in_clir')
            testPreferencesChipField('adm_block_in_list')
            testPreferencesToggleField('adm_block_in_mode')
            testPreferencesChipField('adm_block_out_list')
            testPreferencesToggleField('adm_block_out_mode')
            testPreferencesTextField('adm_block_out_override_pin', 123)
            testPreferencesListField('adm_ncos', ncosLevel.level)
            testPreferencesChipField('block_in_list')
            testPreferencesToggleField('block_in_mode')
            testPreferencesChipField('block_out_list')
            testPreferencesToggleField('block_out_mode')
            testPreferencesTextField('block_out_override_pin', 123)
            testPreferencesTextField('divert_block_out', 123)
            testPreferencesListField('ncos', ncosLevel.level)
        })

        it('Test all Internal settings in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', itemContains: 'Internals' })
            testPreferencesListField('advice_of_charge', 'Currency')
            testPreferencesTextField('concurrent_calls_quota', 123)
            testPreferencesTextField('conference_max_participants', 123)
            testPreferencesListField('prepaid_library', 'libinewrate')
            testPreferencesToggleField('recent_calls_by_upn')
        })

        it('Test all Number Manipulation settings in customer', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer-list')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            clickDataTableSelectedMoreMenuItem('customerPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', itemContains: 'Number Manipulations' })
            testPreferencesTextField('emergency_cli')
            testPreferencesListField('emergency_mapping_container', emergencyMappingContainer.name)
            testPreferencesTextField('emergency_prefix', 123)
            testPreferencesTextField('emergency_suffix', 123)
        })
    })
})
