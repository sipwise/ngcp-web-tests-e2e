/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateHeaderRule,
    apiCreateHeaderRuleset,
    apiCreateHeaderRuleAction,
    apiCreateHeaderRuleCondition,
    apiRemoveHeaderRuleConditionBy,
    apiRemoveHeaderRuleActionBy,
    apiRemoveHeaderRuleBy,
    apiRemoveHeaderRulesetBy
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

const headerRuleset = {
    name: "headerset" + getRandomNum(),
    description: "headerdesc" + getRandomNum(),
    reseller_id: 0,
}

const headerRule = {
    stopper: true,
    enabled: true,
    direction: "inbound",
    description: "headerruledesc" + getRandomNum(),
    name: "headerRule" + getRandomNum(),
    set_id: 0,
    priority: 2
}

const headerRuleCondition = {
    match_part: "full",
    enabled: true,
    match_name: "headerrulecondition" + getRandomNum(),
    match_type: "header",
    expression_negation: true,
    rule_id: 0,
    expression: "is",
    value_type: "input"
}

const headerRuleAction = {
    enabled: true,
    priority: 2,
    action_type: "set",
    header: "header" + getRandomNum(),
    header_part: "full",
    value_part: "full",
    value: "value" + getRandomNum(),
    rule_id: 0
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Header manipulation tests', () => {
    context('UI header manipulation tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id}) => {
                            headerRuleset.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateHeaderRuleset({ data: headerRuleset, authHeader }).then(({ id }) => {
                    apiCreateHeaderRule({ data: { ...headerRule, set_id: id }, authHeader }).then(({ id }) => {
                        apiCreateHeaderRuleAction({ data: { ...headerRuleAction, rule_id: id }, authHeader })
                        apiCreateHeaderRuleCondition({ data: { ...headerRuleCondition, rule_id: id }, authHeader })
                    })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveHeaderRuleConditionBy({ name: headerRuleCondition.match_name, authHeader })
                apiRemoveHeaderRuleActionBy({ name: headerRuleAction.header, authHeader })
                apiRemoveHeaderRuleBy({ name: headerRule.name, authHeader })
                apiRemoveHeaderRulesetBy({ name: headerRuleset.name, authHeader })
            })
        })

        it('Check if header rule set with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/header/create')
            cy.get('input[data-cy="aui-select-reseller"]').type('totallyaninvalidvalueforsure')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="header-rule-set-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a header rule set', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveHeaderRulesetBy({ name: headerRuleset.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/header/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="header-rule-set-name"]').type(headerRuleset.name)
            cy.get('input[data-cy="header-rule-set-description"]').type(headerRuleset.description)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/header')
        })

        it('Edit header ruleset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetEdit"]').click()
            waitPageProgress()
            cy.get('input[data-cy="header-rule-set-description"]').clear().type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--description"]').should('contain.text', 'testdescription')
        })

        it('Delete header rule set and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            deleteItemOnListPageBy(headerRuleset.name)
        })

        it('Check if header rule with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="headerrules-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="headerrules-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a header rule', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveHeaderRuleBy({ name: headerRule.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="headerrules-name"]').type(headerRule.name)
            cy.get('input[data-cy="headerrules-description"]').type(headerRule.description)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit header rule priority and check if it gets applied properly', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesEdit"]').click()
            waitPageProgress()
            cy.get('input[data-cy="headerrules-priority"]').clear().type('0')
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--priority"]').should('contain.text', '0')
        })

        it('Delete header rule and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            deleteItemOnListPageBy(headerRule.name)
        })

        it('Check if header rule action with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesActions"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="headerruleactions-header"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a header rule action', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveHeaderRuleActionBy({ name: headerRuleAction.header, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesActions"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="headerruleactions-header"]').type(headerRuleAction.header)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit header rule action priority and check if it gets applied properly', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesActions"]').click()
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRulesActionsEdit"]').click()
            waitPageProgress()
            cy.get('input[data-cy="headerruleactions-priority"]').clear().type('0')
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--priority"]').should('contain.text', '0')
        })

        it('Delete header rule action and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesActions"]').click()
            waitPageProgress()
            deleteItemOnListPageBy()
        })

        it('Check if header rule condition with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesConditions"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="headerruleconditions-matchPart"]').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a header rule condition', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveHeaderRuleActionBy({ name: headerRuleAction.header, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesConditions"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="headerruleconditions-matchPart"]').type(headerRuleCondition.match_part)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit header rule condition', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesConditions"]').click()
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRulesConditionsEdit"]').click()
            waitPageProgress()
            cy.qSelect({ dataCy: 'headerruleconditions-expression', filter: 'contains', itemContains: 'contains' })
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--expression"]').should('contain.text', 'contains')
        })

        it('Delete header rule condition and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / header')

            cy.locationShouldBe('#/header')
            searchInDataTable(headerRuleset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRules"]').click()
            waitPageProgress()
            searchInDataTable(headerRule.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--headerRuleSetRulesConditions"]').click()
            waitPageProgress()
            deleteItemOnListPageBy()
        })
    })
})
