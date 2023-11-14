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
    waitPageProgress,
    clickDataTableSelectedMoreMenuItem,
    testPreferencesTextField,
    testPreferencesListField
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

const rewriteRuleSet = {
    description: 'description' + getRandomNum(),
    name: 'rulset' + getRandomNum(),
    reseller_id: null
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Reseller preferences tests', () => {
    context('UI Reseller preferences tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    contract.contact_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        apiCreateRewriteRuleSet({ data: { ...rewriteRuleSet, reseller_id: id }, authHeader })
                    })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
            })
        })

        it('Test all access restrictions preferences in reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('resellerPreferences')

            waitPageProgress()
            testPreferencesTextField('concurrent_max', 123, true)
            testPreferencesTextField('concurrent_max_in', 123, true)
            testPreferencesTextField('concurrent_max_in_total', 123, true)
            testPreferencesTextField('concurrent_max_out', 123, true)
            testPreferencesTextField('concurrent_max_out_total', 123, true)
            testPreferencesTextField('concurrent_max_total', 123, true)
        })

        it('Test all CDR/EDR export settings in reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller')

            cy.locationShouldBe('#/reseller')
            searchInDataTable(reseller.name)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('resellerPreferences')

            waitPageProgress()
            cy.get('div[data-cy="q-item--cdr-export-field-separator"]').scrollIntoView()
            testPreferencesTextField('cdr_export_field_separator')
            testPreferencesListField('cdr_export_sclidui_rwrs', rewriteRuleSet.name)
        })
    })
})
