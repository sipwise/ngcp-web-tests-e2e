/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateLNPCarrier,
    apiCreateLNPNumber,
    apiRemoveLNPNumberBy,
    apiRemoveLNPCarrierBy
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const LNPCarrier = {
    name: "carrierLNPTest",
    authoritative: false,
    skip_rewrite: false,
    prefix: "prefixCypress"
}

const LNPNumber = {
    number: 20,
    end: "",
    start: "",
    type: "typeLNPTestCypress",
    carrier_id: 0,
    routing_number: "routingLNPTestCypress"
}

const SecondLNPNumber = {
    number: 21,
    end: "",
    start: "",
    type: "SecondTypeLNPTestCypress",
    carrier_id: 0,
    routing_number: "SecondRoutingLNPTestCypress"
}

const fixturesFolder = Cypress.config('fixturesFolder')
const downloadsFolder = Cypress.config('downloadsFolder')
const path = require('path')

context('LNP tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)

        Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
        cy.log('Preparing environment...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: '100', authHeader})
            apiRemoveLNPNumberBy({ number: '50', authHeader})
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader})
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
            apiRemoveLNPCarrierBy({ name: 'csvLNPCarrierTest', authHeader })
            apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
            cy.log('Data clean up pre-tests completed')
        })

    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            cy.log('Cleaning up db...')
            apiRemoveLNPNumberBy({ number: '100', authHeader})
            apiRemoveLNPNumberBy({ number: '50', authHeader})
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader})
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
            apiRemoveLNPCarrierBy({ name: 'csvLNPCarrierTest', authHeader })
            apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })

            cy.log('Seeding db...')
            apiCreateLNPCarrier({ data: LNPCarrier, authHeader }).then(({ id }) => {
                apiCreateLNPNumber({ data: { ...LNPNumber, carrier_id: id }, authHeader })
                apiCreateLNPNumber({ data: { ...SecondLNPNumber, carrier_id: id }, authHeader })
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: '100', authHeader})
            apiRemoveLNPNumberBy({ number: '50', authHeader})
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader})
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
            apiRemoveLNPCarrierBy({ name: 'csvLNPCarrierTest', authHeader })
            apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
            cy.log('Data clean up pre-tests completed')
        })
    })

    it('Check if LNP carrier with invalid values gets rejected', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        cy.get('a[data-cy="aui-list-action--add"]').click()

        cy.locationShouldBe('#/lnp/carrier_create')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('label[data-cy="lnpcarrier-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('label[data-cy="lnpcarrier-prefix"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a LNP carrier', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader })
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
            apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        cy.get('a[data-cy="aui-list-action--add"]').click()

        cy.locationShouldBe('#/lnp/carrier_create')
        cy.get('input[data-cy="lnpcarrier-name"]').type(LNPCarrier.name)
        cy.get('input[data-cy="lnpcarrier-prefix"]').type(LNPCarrier.prefix)
        cy.get('[data-cy="aui-save-button"]').click()
        waitPageProgressAUI()

        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('td[data-cy="q-td--name"]').should('contain.text', LNPCarrier.name)
        cy.get('td[data-cy="q-td--prefix"]').should('contain.text', LNPCarrier.prefix)
    })

    it('Edit LNP carrier', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierEdit"]').click()
        waitPageProgressAUI()
        cy.get('input[data-cy="lnpcarrier-prefix"]').clear().type('testdescription')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        cy.get('td[data-cy="q-td--name"]').should('contain.text', LNPCarrier.name)
        cy.get('td[data-cy="q-td--prefix"]').should('contain.text', 'testdescription')
    })

    it('Delete LNP carrier and check if they are deleted', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader })
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        deleteItemOnListPageBy(LNPCarrier.name)
    })

    it('Check if LNP Number with invalid values gets rejected', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
        waitPageProgressAUI()
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('label[data-cy="lnpnumber-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a LNP number', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
        waitPageProgressAUI()

        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('input[data-cy="lnpnumber-number"]').type(LNPNumber.number)
        cy.get('input[data-cy="lnpnumber-routingnumber"]').type(LNPNumber.routing_number)
        cy.get('input[data-cy="lnpnumber-type"]').type(LNPNumber.type)
        cy.get('[data-cy="aui-save-button"]').click()
        waitPageProgressAUI()

        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('td[data-cy="q-td--number"]:first').should('contain.text', LNPNumber.number)
        cy.get('td[data-cy="q-td--routing-number"]:first').should('contain.text', LNPNumber.routing_number)
        cy.get('td[data-cy="q-td--type"]:first').should('contain.text', LNPNumber.type)
    })

    it('Edit LNP number', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()

        searchInDataTable(LNPNumber.number)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberEdit"]').click()
        waitPageProgressAUI()
        cy.get('input[data-cy="lnpnumber-type"]').clear().type('testtype')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        cy.get('td[data-cy="q-td--number"]:first').should('contain.text', LNPNumber.number)
        cy.get('td[data-cy="q-td--routing-number"]:first').should('contain.text', LNPNumber.routing_number)
        cy.get('td[data-cy="q-td--type"]:first').should('contain.text', 'testtype')
    })

    it('Delete LNP number and check if they are deleted', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / lnp')

        cy.locationShouldBe('#/lnp')
        searchInDataTable(LNPCarrier.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
        deleteItemOnListPageBy(LNPNumber.number)
    })
})
