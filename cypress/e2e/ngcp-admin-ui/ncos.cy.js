/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateContract,
    apiCreateReseller,
    apiCreateNCOSLNPCarrier,
    apiLoginAsSuperuser,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiCreateSystemContact,
    apiCreateNCOSLevel,
    apiCreateNCOSPattern,
    apiRemoveNCOSPatternBy,
    apiRemoveNCOSLevelBy,
    apiRemoveNCOSLNPCarrierBy
} from '../../support/ngcp-admin-ui/e2e'

const path = require('path')
const ngcpConfig = Cypress.config('ngcpConfig')

const systemContactDependency = {
    email: 'contact' + getRandomNum() + '@example.com'
}

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const NCOSLevel = {
    id: 0,
    reseller_id: 0,
    level: 'level' + getRandomNum(),
    mode: 'whitelist',
    description: 'desc' + getRandomNum()
}

const NCOSLNPCarrier = {
    id: 0,
    carrier_id: 3,
    description: "desc" + getRandomNum(),
    ncos_level_id: 0
}

const NCOSPattern = {
    id: 0,
    description: "desc" + getRandomNum(),
    ncos_level_id: 0,
    pattern: "pattern" + getRandomNum()
}

const NCOSSet = {
    id: 0,
    name: "NCOSSet" + getRandomNum(),
    description: "desc" + getRandomNum(),
    customer_expose: false
}

context('NCOS tests', () => {
    context('UI NCOS tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            NCOSLevel.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateNCOSLevel({ data: NCOSLevel, authHeader }).then(({ id }) => {
                    NCOSLevel.id = id
                    apiCreateNCOSLNPCarrier({ data: { ...NCOSLNPCarrier, ncos_level_id: id }, authHeader }).then(({ id }) => {
                        NCOSLNPCarrier.id = id
                    })
                    apiCreateNCOSPattern({ data: { ...NCOSPattern, ncos_level_id: id }, authHeader }).then(({ id }) => {
                        NCOSPattern.id = id
                    })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLNPCarrierBy({ name: NCOSLNPCarrier.id, authHeader})
                apiRemoveNCOSPatternBy({ name: NCOSPattern.pattern, authHeader })
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })
        })

        it('Create a NCOS Set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets')

            cy.locationShouldBe('#/ncossets')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/ncossets/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="ncos-set-name"]').type(NCOSSet.name)
            cy.get('input[data-cy="ncos-set-description"]').type(NCOSSet.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'NCOS Set created successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/ncossets')
        })

        it('Edit NCOS Set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets')

            cy.locationShouldBe('#/ncossets')
            searchInDataTable(NCOSSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--ncosSetsEdit"]').click()

            cy.get('input[data-cy="ncos-set-description"]').clear()
            cy.get('input[data-cy="ncos-set-description"]').type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'NCOS Set saved successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            waitPageProgress()

            cy.locationShouldBe('#/ncossets')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')
        })

        it('Create a NCOS Level', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos')

            cy.locationShouldBe('#/ncos')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/ncos/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="ncoslevels-level"]').type(NCOSLevel.level)
            cy.get('input[data-cy="ncoslevels-description"]').type(NCOSLevel.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'NCOS Level created successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/ncos')
        })

        it('Edit a NCOS Level', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos')

            cy.locationShouldBe('#/ncos')
            searchInDataTable(NCOSLevel.level)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--ncosLevelEdit"]').click()

            cy.get('input[data-cy="ncoslevels-description"]').clear()
            cy.get('input[data-cy="ncoslevels-description"]').type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'NCOS Level saved successfully').should('be.visible')

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            cy.locationShouldBe('#/ncos')

            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')

        })


        it('Add/Remove NCOS level to NCOS set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets')

            cy.locationShouldBe('#/ncossets')
            searchInDataTable(NCOSSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--ncosSetLevelsList"]').click()

            waitPageProgress()
            cy.get('button[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-data-table-row-menu--addLevel"]').click()

            cy.get('div[data-cy="ncos-set-levels-list"] input:last').type('thisshouldneverexist123')
            waitPageProgress()

            cy.get('button[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
            cy.get('button[data-cy="btn-confirm"]').click()

            cy.get('div[data-cy="ncos-set-levels-selected"] i').contains('warning').should('be.visible')
        })

        it('Delete NCOS Level', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos')

            cy.locationShouldBe('#/ncos')
            deleteItemOnListPageBy(NCOSLevel.level)
        })

        it('Delete NCOS Set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets')

            cy.locationShouldBe('#/ncossets')
            deleteItemOnListPageBy(NCOSSet.name)
        })
    })
})
