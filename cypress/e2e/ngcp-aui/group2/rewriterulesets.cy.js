/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateContract,
    apiCreateReseller,
    apiLoginAsSuperuser,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiCreateSystemContact,
    apiCreateRewriteRuleSet,
    apiRemoveRewriteRuleSetBy
} from '../../../support/ngcp-aui/e2e'

var cloneCreated = false
const path = require('path')
const ngcpConfig = Cypress.config('ngcpConfig')

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractRewriteRules',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerRewriteRules',
    enable_rtc: false
}

const rewriteRuleSet = {
    reseller_id: 0,
    name: 'rewriteruleset1',
    description: 'string',
    rewriterules: [{
            field: "callee",
            enabled: true,
            direction: "in",
            replace_pattern: "stringreplace1",
            priority: 0,
            description: "desc",
            match_pattern: "stringmatch2"
        },{
            field: "callee",
            enabled: true,
            direction: "out",
            replace_pattern: "stringreplace3",
            priority: 0,
            description: "desc",
            match_pattern: "stringmatch4"
        },{
            field: "caller",
            enabled: true,
            direction: "out",
            replace_pattern: "firstcallreplace",
            priority: 0,
            description: "desc",
            match_pattern: "firstcallmatch"
        },{
            field: "caller",
            enabled: true,
            direction: "out",
            replace_pattern: "secondcallreplace",
            priority: 0,
            description: "desc",
            match_pattern: "secondcallmatch"
        },{
            field: "caller",
            enabled: true,
            direction: "lnp",
            replace_pattern: "stringreplace5",
            priority: 0,
            description: "desc",
            match_pattern: "stringmatch6"
        },{
            field: "callee",
            enabled: true,
            direction: "lnp",
            replace_pattern: "stringreplace7",
            priority: 0,
            description: "desc",
            match_pattern: "stringmatch8"
        }]
}

const systemContactDependency = {
    email: 'testRewriteRuleStets@example.com'
}

context('Rewrite Rule Set tests', () => {
    context('UI Rewrite Rule Set tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name + "clone", authHeader })
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            rewriteRuleSet.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name + "clone", authHeader })
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })

                cy.log('Seeding db...')
                apiCreateRewriteRuleSet({ data: rewriteRuleSet, authHeader }).then(({ id }) => {
                })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name + "clone", authHeader })
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })

        it('Create a Rewrite Rule Set', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/rewrite/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="rewrite-rule-set-name"]').type(rewriteRuleSet.name)
            cy.get('input[data-cy="rewrite-rule-set-description"]').type(rewriteRuleSet.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Rewrite Rule Set created successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/rewrite')
        })

        it('Edit a Rewrite Rule Set', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetsEdit"]').click()

            cy.get('input[data-cy="rewrite-rule-set-description"]').clear()
            cy.get('input[data-cy="rewrite-rule-set-description"]').type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Rewrite Rule Set saved successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()

            cy.locationShouldBe('#/rewrite')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')
        })

        it('Clone a Rewrite Rule Set', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetClone"]').click()

            cy.get('input[data-cy="rewrite-rule-set-name"]').type('clone')
            cy.get('input[data-cy="rewrite-rule-set-description"]').type('clone')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Rewrite Rule Set cloned successfully').should('be.visible')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cloneCreated = true

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name + "clone")
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains(rewriteRuleSet.description + 'clone').should('be.visible')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains(rewriteRuleSet.name + 'clone').should('be.visible')

            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetRules"]').click()

            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"] span').contains(rewriteRuleSet.rewriterules[0].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"] span').contains(rewriteRuleSet.rewriterules[0].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"] span').contains(rewriteRuleSet.rewriterules[0].description).should('be.visible')

            cy.contains('Outbound for Callee').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"] span').contains(rewriteRuleSet.rewriterules[1].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"] span').contains(rewriteRuleSet.rewriterules[1].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"] span').contains(rewriteRuleSet.rewriterules[1].description).should('be.visible')

            cy.contains('Outbound for Caller').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"]:first span').contains(rewriteRuleSet.rewriterules[2].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"]:first span').contains(rewriteRuleSet.rewriterules[2].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"]:first span').contains(rewriteRuleSet.rewriterules[2].description).should('be.visible')
            cy.get('td[data-cy="q-td--match-pattern"]:last span').contains(rewriteRuleSet.rewriterules[3].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"]:last span').contains(rewriteRuleSet.rewriterules[3].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"]:last span').contains(rewriteRuleSet.rewriterules[3].description).should('be.visible')

            cy.contains('LNP for Caller').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"] span').contains(rewriteRuleSet.rewriterules[4].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"] span').contains(rewriteRuleSet.rewriterules[4].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"] span').contains(rewriteRuleSet.rewriterules[4].description).should('be.visible')

            cy.contains('LNP for Callee').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"] span').contains(rewriteRuleSet.rewriterules[5].match_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"] span').contains(rewriteRuleSet.rewriterules[5].replace_pattern).should('be.visible')
            cy.get('td[data-cy="q-td--description"] span').contains(rewriteRuleSet.rewriterules[5].description).should('be.visible')
        })

        it('Create a Rewrite Rule', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetRules"]').click()

            waitPageProgress()
            cy.contains('Inbound for Caller').click()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="rewrite-rule-match_pattern"]').type("stringmatch")
            cy.get('input[data-cy="rewrite-rule-replace_pattern"]').type("stringreplace")
            cy.get('input[data-cy="rewrite-rule-description"]').type("description")
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Rewrite rule successfully created').should('be.visible')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit a Rewrite Rule', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetRules"]').click()
            
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRulesEdit"]').click()

            cy.get('input[data-cy="rewrite-rule-match_pattern"]').clear().type("replacestringmatch")
            cy.get('input[data-cy="rewrite-rule-replace_pattern"]').clear().type("replacestringreplace")
            cy.get('input[data-cy="rewrite-rule-description"]').clear().type("replacedescription")
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Rewrite rule successfully updated').should('be.visible')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()

            cy.get('td[data-cy="q-td--match-pattern"] span').contains('replacestringmatch').should('be.visible')
            cy.get('td[data-cy="q-td--replace-pattern"] span').contains('replacestringreplace').should('be.visible')
            cy.get('td[data-cy="q-td--description"] span').contains('replacedescription').should('be.visible')

        })

        it('Move a Rewrite Rule', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetRules"]').click()
            
            waitPageProgress()
            cy.contains('Outbound for Caller').click()
            cy.get('div[class="aui-data-table"] .q-checkbox:first').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('div[data-cy="aui-data-table-row-menu--rewriteRuleSetRuleDown"]').click()
            cy.get('td[data-cy="q-td--match-pattern"]:last').contains('firstcallmatch').should('be.visible')
            cy.get('div[class="aui-data-table"] .q-checkbox:last').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('div[data-cy="aui-data-table-row-menu--rewriteRuleSetRuleUp"]').click()

            waitPageProgress()
            cy.get('td[data-cy="q-td--match-pattern"]:first').contains('firstcallmatch').should('be.visible')
        })

        it('Delete a Rewrite Rule', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            searchInDataTable(rewriteRuleSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--rewriteRuleSetRules"]').click()
            
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--delete"]').click()
            cy.get('button[data-cy="btn-confirm"]').click()

            cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
        })

        it('Delete Rewrite Rule Set', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / rewrite')

            cy.locationShouldBe('#/rewrite')
            deleteItemOnListPageBy(rewriteRuleSet.name)
        })
    })
})
