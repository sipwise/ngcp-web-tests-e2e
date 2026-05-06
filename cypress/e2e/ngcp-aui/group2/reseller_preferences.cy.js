/// <reference types="cypress" />

import {
    apiCreateContract,
    apiCreateReseller,
    apiCreateRewriteRuleSet,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveRewriteRuleSetBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    searchInDataTable,
    waitPageProgressAUI,
    clickDataTableSelectedMoreMenuItem,
    testPreferencesTextField,
    testPreferencesListField
} from '../../../support/e2e'

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'resellerPrefContract',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerPrefCypress',
    enable_rtc: false
}

const rewriteRuleSet = {
    description: 'descriptionCypress',
    name: 'rulset' + getRandomNum(),
    reseller_id: null
}

const systemContact = {
    email: 'systemContactResellerPref@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller Preferences tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                contract.contact_id = id
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
    })

    it('Test all access restrictions preferences in reseller', () => {
        // Setup: Create Reseller
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        searchInDataTable(reseller.name)
        cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
        clickDataTableSelectedMoreMenuItem('resellerPreferences')

        waitPageProgressAUI()
        testPreferencesTextField('concurrent_max', 123, true)
        testPreferencesTextField('concurrent_max_in', 123, true)
        testPreferencesTextField('concurrent_max_in_total', 123, true)
        testPreferencesTextField('concurrent_max_out', 123, true)
        testPreferencesTextField('concurrent_max_out_total', 123, true)
        testPreferencesTextField('concurrent_max_total', 123, true)

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
        })
    })

    it('Test all CDR/EDR export settings in reseller', () => {
        // Setup: Create Reseller and Rewrite Rule Set
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                    apiCreateRewriteRuleSet({ data: { ...rewriteRuleSet, reseller_id: id }, authHeader })
                })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / reseller')

        cy.locationShouldBe('#/reseller')
        searchInDataTable(reseller.name)
        cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
        clickDataTableSelectedMoreMenuItem('resellerPreferences')

        waitPageProgressAUI()
        cy.get('div[data-cy="q-item--cdr-export-field-separator"]').scrollIntoView()
        testPreferencesTextField('cdr_export_field_separator')
        testPreferencesListField('cdr_export_sclidui_rwrs', rewriteRuleSet.name)

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
        })
    })
})
