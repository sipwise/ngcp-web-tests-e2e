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

    context('LNP tests Carriers menu', () => {
        it('Check if LNP carrier with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/lnp/carriers/create')
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

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/lnp/carriers/create')
            cy.get('input[data-cy="lnpcarrier-name"]').type(LNPCarrier.name)
            cy.get('input[data-cy="lnpcarrier-prefix"]').type(LNPCarrier.prefix)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgressAUI()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/lnp/carriers')
            cy.get('td[data-cy="q-td--name"]').should('contain.text', LNPCarrier.name)
            cy.get('td[data-cy="q-td--prefix"]').should('contain.text', LNPCarrier.prefix)
        })

        it('Edit LNP carrier', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
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

            cy.locationShouldBe('#/lnp/carriers')
            deleteItemOnListPageBy(LNPCarrier.name)
        })

        it('Check if LNP Number with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
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

            cy.locationShouldBe('#/lnp/carriers')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
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

            cy.locationShouldBe('#/lnp/carriers')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()

            searchInDataTable(LNPNumber.number)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumberEdit"]').click()
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

            cy.locationShouldBe('#/lnp/carriers')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
            deleteItemOnListPageBy(LNPNumber.number)
        })
    })

    context('LNP tests Numbers menu', () => {
        it('Check if LNP Number from the numbers table with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)

            cy.navigateMainMenu('settings / lnp')
            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')

            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-lnp-carrier"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="lnpnumber-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a LNP number from the numbers table', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
                apiRemoveLNPNumberBy({ number: SecondLNPNumber.number, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)

            cy.navigateMainMenu('settings / lnp')
            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')

            waitPageProgressAUI()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-lnp-carrier', filter: LNPCarrier.name, itemContains: LNPCarrier.name })
            cy.get('input[data-cy="lnpnumber-number"]').type(SecondLNPNumber.number)
            cy.get('input[data-cy="lnpnumber-routingnumber"]').type(SecondLNPNumber.routing_number)
            cy.get('input[data-cy="lnpnumber-type"]').type(SecondLNPNumber.type)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgressAUI()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('td[data-cy="q-td--number"]').should('contain.text', SecondLNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', SecondLNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('contain.text', SecondLNPNumber.type)
        })

        it('Edit LNP number from the numbers table', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')
            waitPageProgressAUI()

            searchInDataTable(SecondLNPNumber.number)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberEdit"]').click()
            waitPageProgressAUI()
            cy.get('input[data-cy="lnpnumber-type"]').clear().type('testtype')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--number"]').should('contain.text', SecondLNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', SecondLNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('contain.text', 'testtype')
        })

        it('Delete LNP number from the numbers table and check if they are deleted', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')
            waitPageProgressAUI()
            deleteItemOnListPageBy(SecondLNPNumber.number)
        })
    })

    context('Upload/Download tests', () => {
        it('Download LNP Porting Numbers', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')

            cy.get('button[data-cy="lnp-numbers-list-download-csv"]').click()
            const filename = path.join(downloadsFolder, 'lnp_list.csv')
            cy.readFile(filename, 'binary', { timeout: 2000 })
                .should(buffer => expect(buffer.length).to.be.gt(75))
        })

        it('Upload LNP Porting Numbers, check if numbers are in correct LNP Carrier', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[href="#/lnp/numbers"]').click()
            cy.locationShouldBe('#/lnp/numbers')
            cy.get('a[data-cy="lnp-numbers-list-upload-csv"]').click()

            cy.get('input[type="file"][data-cy="phonebook-upload-field"]').selectFile(path.join(fixturesFolder, 'lnp_list_carrier.csv'), { force: 'true' })
            cy.get('button[data-cy="aui-save-button"]:last').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            waitPageProgressAUI()
            searchInDataTable(LNPNumber.number)
            cy.get('td[data-cy="q-td--number"]').should('contain.text', LNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', LNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('contain.text', LNPNumber.type)
            searchInDataTable(SecondLNPNumber.number)
            cy.get('td[data-cy="q-td--number"]').should('contain.text', SecondLNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', SecondLNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('contain.text', SecondLNPNumber.type)
            searchInDataTable('100')
            cy.get('td[data-cy="q-td--number"]').should('contain.text', '100')
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', 'csvCarrierNumberRouting')
            cy.get('td[data-cy="q-td--type"]').should('contain.text', 'csvCarrierNumberType')
            cy.get('a[href="#/lnp/carriers"]').click()
            cy.locationShouldBe('#/lnp/carriers')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
            waitPageProgressAUI()
            cy.get('td[data-cy="q-td--number"]:first').should('contain.text', LNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]:first').should('contain.text', LNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]:first').should('contain.text', LNPNumber.type)
            cy.get('td[data-cy="q-td--number"]:last').should('not.contain.text', '100')
            cy.get('td[data-cy="q-td--routing-number"]:last').should('not.contain.text', 'csvCarrierNumberRouting')
            cy.get('td[data-cy="q-td--type"]:last').should('not.contain.text', 'csvCarrierNumberType')
            cy.navigateMainMenu('settings / lnp')
            searchInDataTable('csvLNPCarrierTest')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
            waitPageProgressAUI()
            cy.get('td[data-cy="q-td--number"]').should('not.contain.text', LNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('not.contain.text', LNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('not.contain.text', LNPNumber.type)
            cy.get('td[data-cy="q-td--number"]').should('not.contain.text', SecondLNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('not.contain.text', SecondLNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('not.contain.text', SecondLNPNumber.type)
            cy.get('td[data-cy="q-td--number"]').should('contain.text', '100')
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', 'csvCarrierNumberRouting')
            cy.get('td[data-cy="q-td--type"]').should('contain.text', 'csvCarrierNumberType')
        })

        it('Upload and purge LNP Porting Numbers', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp/carriers')
            cy.get('a[data-cy="lnp-carriers-list-upload-csv"]').click()

            cy.get('input[type="file"][data-cy="phonebook-upload-field"]').selectFile(path.join(fixturesFolder, 'lnp_list.csv'), { force: 'true' })
            cy.get('div[data-cy="phonebook-purge"]').click()
            cy.get('button[data-cy="aui-save-button"]:last').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            waitPageProgressAUI()
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierNumbersList"]').click()
            waitPageProgressAUI()
            cy.get('td[data-cy="q-td--number"]').should('not.contain.text', LNPNumber.number)
            cy.get('td[data-cy="q-td--routing-number"]').should('not.contain.text', LNPNumber.routing_number)
            cy.get('td[data-cy="q-td--type"]').should('not.contain.text', LNPNumber.type)
            cy.get('td[data-cy="q-td--number"]').should('contain.text', '50')
            cy.get('td[data-cy="q-td--routing-number"]').should('contain.text', 'lnpCSVTestUpload')
            cy.get('td[data-cy="q-td--type"]').should('contain.text', 'lnpCSVTestUploadType')
        })
    })
})
