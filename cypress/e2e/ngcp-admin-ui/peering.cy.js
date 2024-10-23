/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateContract,
    apiLoginAsSuperuser,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiCreateSystemContact,
    apiCreatePeeringGroup,
    apiCreatePeeringInboundRule,
    apiCreatePeeringOutboundRule,
    apiCreatePeeringServer,
    apiRemovePeeringServerBy,
    apiRemovePeeringOutboundRuleBy,
    apiRemovePeeringInboundRuleBy,
    apiRemovePeeringGroupBy
} from '../../support/ngcp-admin-ui/e2e'
import { contract } from '../../support/aui-test-data';

const ngcpConfig = Cypress.config('ngcpConfig')

const peeringGroup = {
    priority: "1",
    contract_id: 0,
    name: "peeringgroupCypress",
    description: "descCypress"
}

const peeringInboundRule = {
    reject_reason: "rejectCypress",
    field: "from_user",
    reject_code: 404,
    enabled: true,
    priority: getRandomNum(3),
    group_id: 0,
    pattern: "patternCypress"
}

const PeeringOutboundRule = {
    stopper: true,
    caller_pattern: "caller_patternCypress",
    callee_pattern: "callee_patternCypress",
    callee_prefix: "prefixCypress",
    description: "outboundCypress",
    group_id: 0,
    enabled: true
}

const peeringServer = {
    weight: 1,
    probe: false,
    enabled: true,
    port: 99,
    host: "hostnameCypress",
    via_route: "",
    group_id: 0,
    name: "peeringserverCypress",
    ip: "10.0.0.1"
}

// We are not exporting this object to avoid dependencies
// if we run tests in parallel in the future
const systemContactDependency = {
    email: 'systemContactDependencyPeering@example.com'
}

context('Peering tests', () => {
    context('UI Peering tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.pattern, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id, type: 'sippeering' }, authHeader }).then(({ id }) => {
                        peeringGroup.contract_id = id
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    peeringInboundRule.group_id = id
                    apiCreatePeeringInboundRule({ data: { ...peeringInboundRule, group_id: id}, authHeader })
                    apiCreatePeeringOutboundRule({ data: { ...PeeringOutboundRule, group_id: id}, authHeader })
                    apiCreatePeeringServer({ data: { ...peeringServer, group_id: id}, authHeader })
                })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.pattern, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Check if Peering group with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/peering/create')
            cy.get('[data-cy="aui-select-contract"] input').type('totallyaninvalidvalueforsure')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-contract"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="peering-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a Peering group', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                peeringGroup.name = "peeringgroup" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/peering/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contract', filter: peeringGroup.contract_id, itemContains: peeringGroup.contract_id })
            cy.get('input[data-cy="peering-name"]').type(peeringGroup.name)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Peering group created successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/peering')
        })

        it('Edit a Peering group', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupEdit"]').click()

            cy.get('input[data-cy="peering-description"]').clear()
            cy.get('input[data-cy="peering-description"]').type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgress()

            cy.locationShouldBe('#/peering')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')
        })

        it('Check if Inbound peering rule with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="inbound-pattern"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="inbound-priority"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="inbound-priority"]').type('sakjfdhajkdas')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="inbound-priority"]').find('div[role="alert"]').contains('Only none decimal numbers are allowed').should('be.visible')
            cy.get('input[data-cy="inbound-priority"]').clear().type('1.5')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="inbound-priority"]').find('div[role="alert"]').contains('Only none decimal numbers are allowed').should('be.visible')
        })

        it('Create an Inbound peering rule', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                peeringInboundRule.pattern = "pattern" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="inbound-pattern"]').type(peeringInboundRule.pattern)
            cy.get('input[data-cy="inbound-reject_code"]').type(peeringInboundRule.reject_code)
            cy.get('input[data-cy="inbound-reject_reason"]').type(peeringInboundRule.reject_reason)
            cy.get('input[data-cy="inbound-priority"]').type(peeringInboundRule.priority)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit an Inbound peering rule', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetailsInboundRuleEdit"]').click()

            cy.get('input[data-cy="inbound-reject_reason"]').clear().type('newrejectreason')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgress()

            cy.get('td[data-cy="q-td--reject-reason"]').contains('newrejectreason').should('be.visible')
        })

        it('Check if Outbound peering rule with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/outboundrules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="outbound-description"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create an Outbound peering rule', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                PeeringOutboundRule.description = "outbound" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/outboundrules"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="outbound-callee_prefix"]').type(PeeringOutboundRule.callee_prefix)
            cy.get('input[data-cy="outbound-callee_pattern"]').type(PeeringOutboundRule.callee_pattern)
            cy.get('input[data-cy="outbound-caller_pattern"]').type(PeeringOutboundRule.caller_pattern)
            cy.get('input[data-cy="outbound-description"]').type(PeeringOutboundRule.description)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit an Outbound peering rule', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/outboundrules"]').click()
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetailsOutboundRuleEdit"]').click()

            cy.get('input[data-cy="outbound-callee_prefix"]').clear().type('newcalleeprefix')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgress()

            cy.get('td[data-cy="q-td--callee-prefix"]').contains('newcalleeprefix').should('be.visible')
        })

        it('Check if Peering server with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/server"]:first').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="server-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="server-ip"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="server-ip"]').type('invalidip')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="server-ip"]').parents('label').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')
        })

        it('Create a Peering server', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                peeringServer.name = "peeringserver" + getRandomNum()
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/server"]:first').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="server-name"]').type(peeringServer.name)
            cy.get('input[data-cy="server-ip"]').type(peeringServer.ip)
            cy.get('input[data-cy="server-host"]').type(peeringServer.host)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit an Peering server', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/server"]:first').click()
            waitPageProgress()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupServerEdit"]').click()

            cy.get('input[data-cy="server-host"]').clear().type('PeeringServerHost')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgress()

            cy.get('td[data-cy="q-td--host"]').contains('PeeringServerHost').should('be.visible')
        })

        it('Delete Peering server', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/server"]:first').click()
            waitPageProgress()
            deleteItemOnListPageBy()
        })

        it('Delete Outbound peering rule', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/outboundrules"]').click()
            waitPageProgress()
            deleteItemOnListPageBy()
        })

        it('Delete Inbound peering rule', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgress()
            cy.get('a[href="#/peering/' + peeringInboundRule.group_id + '/details/inboundrules"]').click()
            waitPageProgress()
            deleteItemOnListPageBy()
        })

        it('Delete Peering group', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            deleteItemOnListPageBy(peeringGroup.name, 'Name')
        })
    })
})
