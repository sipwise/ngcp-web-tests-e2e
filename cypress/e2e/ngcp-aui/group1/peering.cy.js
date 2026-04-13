/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgressAUI,
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
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractPeeringCypress',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const peeringGroup = {
    priority: "1",
    contract_id: 0,
    name: "peeringGroupCypress",
    description: "descCypress"
}

const peeringInboundRule = {
    reject_reason: "rejectCypress",
    field: "from_user",
    reject_code: 404,
    enabled: true,
    priority: getRandomNum(3),
    group_id: 0,
    pattern: "patternPeeringCypress"
}

const PeeringOutboundRule = {
    stopper: true,
    caller_pattern: "caller_patternCypress",
    callee_pattern: "callee_patternCypress",
    callee_prefix: "prefixPeering",
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
    transport: 1,
    via_route: null,
    group_id: 0,
    name: "peeringServerCypress",
    ip: "10.0.0.1"
}

const systemContactDependency = {
    email: 'systemContactDependencyPeering@example.com'
}

context('Peering tests', () => {
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

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
            apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
            apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.pattern, authHeader })
            apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
        })
    })

    context('Peering Group tests', () => {
        it('Check if Peering Group with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/peering/create')
            cy.get('[data-cy="aui-select-contract"] input').type('totallyaninvalidvalueforsure')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-contract"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="peering-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')

        })

        it('Create a Peering Group', () => {
            // Setup: Remove Peering Group if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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

            // Setup: Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Edit a Peering Group', () => {
            // Setup: Create Peering Group
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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
            waitPageProgressAUI()

            cy.locationShouldBe('#/peering')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Delete Peering Group', () => {
            // Setup: Create Peering Group
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            deleteItemOnListPageBy(peeringGroup.name, 'Name')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })
    })

    context('Inbound Peering Rule tests', () => {
        it('Check if Inbound Peering Rule with invalid values gets rejected', () => {
            // Setup: Create Peering Group
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
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

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Create an Inbound Peering Rule', () => {
            // Setup: Create Peering Group, remove Inbound Peering Rule if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="inbound-pattern"]').type(peeringInboundRule.pattern)
            cy.get('input[data-cy="inbound-reject_code"]').type(peeringInboundRule.reject_code)
            cy.get('input[data-cy="inbound-reject_reason"]').type(peeringInboundRule.reject_reason)
            cy.get('input[data-cy="inbound-priority"]').type(peeringInboundRule.priority)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Edit an Inbound Peering Rule', () => {
            // Setup: Create Peering Group and Inbound Peering Rule
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringInboundRule({ data: { ...peeringInboundRule, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetailsInboundRuleEdit"]').click()

            cy.get('input[data-cy="inbound-reject_reason"]').clear().type('newrejectreason')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()

            cy.get('td[data-cy="q-td--reject-reason"]').contains('newrejectreason').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Delete Inbound Peering Rule', () => {
            // Setup: Create Peering Group and Inbound Peering Rule
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringInboundRule({ data: { ...peeringInboundRule, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            deleteItemOnListPageBy()

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringInboundRuleBy({ name: peeringInboundRule.group_id, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })
    })

    context('Outbound Peering Rule tests', () =>{
        it('Check if Outbound Peering Rule with invalid values gets rejected', () => {
            // Setup: Create Peering Group
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Outbound Rules').click()
            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="outbound-description"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Create an Outbound Peering Rule', () => {
            // Setup: Create Peering Group, remove Outbound Peering Rule if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Outbound Rules').click()
            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="outbound-callee_prefix"]').type(PeeringOutboundRule.callee_prefix)
            cy.get('input[data-cy="outbound-callee_pattern"]').type(PeeringOutboundRule.callee_pattern)
            cy.get('input[data-cy="outbound-caller_pattern"]').type(PeeringOutboundRule.caller_pattern)
            cy.get('input[data-cy="outbound-description"]').type(PeeringOutboundRule.description)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Edit an Outbound Peering Rule', () => {
            // Setup: Create Peering Group and Outbound Peering Rule
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringOutboundRule({ data: { ...PeeringOutboundRule, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Outbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetailsOutboundRuleEdit"]').click()

            cy.get('input[data-cy="outbound-callee_prefix"]').clear().type('newcalleeprefix')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()

            cy.get('td[data-cy="q-td--callee-prefix"]').contains('newcalleeprefix').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Delete Outbound Peering Rule', () => {
            // Setup: Create Peering Group and Outbound Peering Rule
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringOutboundRule({ data: { ...PeeringOutboundRule, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Outbound Rules').click()
            waitPageProgressAUI()
            deleteItemOnListPageBy()

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringOutboundRuleBy({ name: PeeringOutboundRule.description, authHeader})
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })
    })

    context('Peering Server tests', () => {
        it('Check if Peering Server with invalid values gets rejected', () => {
            // Setup: Create Peering Group
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Peering Servers').click()
            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="server-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="server-ip"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="server-ip"]').type('invalidip')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('input[data-cy="server-ip"]').parents('label').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Create a Peering Server', () => {
            // Setup: Create Peering Group, remove Peering Server if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Peering Servers').click()
            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.get('input[data-cy="server-name"]').type(peeringServer.name)
            cy.get('input[data-cy="server-ip"]').type(peeringServer.ip)
            cy.get('input[data-cy="server-host"]').type(peeringServer.host)
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Edit an Peering Server', () => {
            // Setup: Create Peering Group and Peering Server
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringServer({ data: { ...peeringServer, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Peering Servers').click()
            waitPageProgressAUI()
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupServerEdit"]').click()

            cy.get('input[data-cy="server-host"]').clear().type('PeeringServerHost')
            cy.get('[data-cy="aui-save-button"]').click()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgressAUI()

            cy.get('td[data-cy="q-td--host"]').contains('PeeringServerHost').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })

        it('Delete Peering Server', () => {
            // Setup: Create Peering Group and Peering Server
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
                apiCreatePeeringGroup({ data: peeringGroup, authHeader }).then(({ id }) => {
                    apiCreatePeeringServer({ data: { ...peeringServer, group_id: id}, authHeader })
                })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / peering')

            cy.locationShouldBe('#/peering')
            searchInDataTable(peeringGroup.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--peeringGroupDetails"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Inbound Rules').click()
            waitPageProgressAUI()
            cy.get('div[data-cy="q-item-label"]').contains('Peering Servers').click()
            waitPageProgressAUI()
            deleteItemOnListPageBy()

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemovePeeringServerBy({ name: peeringServer.name, authHeader })
                apiRemovePeeringGroupBy({ name: peeringGroup.name, authHeader })
            })
        })
    })
})
