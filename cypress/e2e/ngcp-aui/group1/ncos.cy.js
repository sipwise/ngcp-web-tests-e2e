/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateContract,
    apiCreateReseller,
    apiLoginAsSuperuser,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiCreateSystemContact,
    apiCreateNCOSLevel,
    apiRemoveNCOSLevelBy,
    apiRemoveNCOSSetBy,
    apiCreateNCOSSet,
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractNcosCypress',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const NCOSLevel = {
    reseller_id: 0,
    level: 'levelNCOSCypress',
    mode: 'whitelist',
    description: 'desc' + getRandomNum()
}

const NCOSSet = {
    name: "NCOSSetTest",
    description: "desc" + getRandomNum(),
    reseller_id: 0
}

const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerNcosCypress',
    enable_rtc: false
}

const systemContactDependency = {
    email: 'systemContactyncos@example.com'
}

context('NCOS tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        NCOSSet.reseller_id = id
                        NCOSLevel.reseller_id = id
                    })
                })
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
        })
    })

    context('NCOS Set tests', () => {
        it('Try to create NCOS set with invalid values', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets', false)

            cy.locationShouldBe('#/ncossets')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/ncossets/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-reseller"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="ncos-set-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="ncos-set-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })


        it('Create a NCOS Set', () => {
            // Setup: Delete NCOS Set if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets', false)

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

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            })
        })

        it('Edit NCOS Set', () => {
            // Setup: Create NCOS Set
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
                apiCreateNCOSSet({ data: NCOSSet, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets', false)

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

            cy.locationShouldBe('#/ncossets')
            cy.get('span[data-cy="aui-data-table-inline-edit--input"]').contains('testdescription').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            })
        })

        it('Delete NCOS Set', () => {
            // Setup: Create NCOS Set
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
                apiCreateNCOSSet({ data: NCOSSet, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets', false)

            cy.locationShouldBe('#/ncossets')
            deleteItemOnListPageBy(NCOSSet.name)

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            })
        })
    })

    context('NCOS Level tests', () => {
        it('Try to create a NCOS Level with invalid values', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos', false)

            cy.locationShouldBe('#/ncos')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/ncos/create')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-reseller"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="ncoslevels-level"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a NCOS Level', () => {
            // Delete NCOS Level if exists
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos', false)

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

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })
        })

        it('Edit a NCOS Level', () => {
            // Create NCOS Level
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
                apiCreateNCOSLevel({ data: NCOSLevel, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos', false)

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

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })
        })

        it('Add/Remove NCOS Level to NCOS Set', () => {
            // Create NCOS Level and NCOS Set
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
                apiCreateNCOSSet({ data: NCOSSet, authHeader })
                apiCreateNCOSLevel({ data: NCOSLevel, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncossets', false)

            cy.locationShouldBe('#/ncossets')
            searchInDataTable(NCOSSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--ncosSetLevelsList"]').click()

            waitPageProgressAUI()
            cy.get('button[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-data-table-row-menu--addLevel"]').click()

            waitPageProgressAUI()
            cy.get('div[data-cy="ncos-set-levels-list"] input:last').type('thisshouldneverexist123')
            waitPageProgressAUI()

            cy.get('button[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
            cy.get('button[data-cy="btn-confirm"]').click()

            cy.get('div[data-cy="ncos-set-levels-selected"] i').contains('warning').should('be.visible')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
                apiRemoveNCOSSetBy({ name: NCOSSet.name, authHeader })
            })
        })

        it('Delete NCOS Level', () => {
            // Create NCOS Level
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
                apiCreateNCOSLevel({ data: NCOSLevel, authHeader })
            })

            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / ncos', false)

            cy.locationShouldBe('#/ncos')
            deleteItemOnListPageBy(NCOSLevel.level)

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveNCOSLevelBy({ name: NCOSLevel.level, authHeader })
            })
        })
    })
})
