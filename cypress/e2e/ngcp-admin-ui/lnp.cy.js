/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateLNPCarrier,
    apiCreateLNPNumber,
    apiRemoveLNPNumberBy,
    apiRemoveLNPCarrierBy,
    getRandomNum
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const LNPCarrier = {
    name: "carrierLNPTest",
    authoritative: false,
    skip_rewrite: false,
    prefix: "prefixCypress"
}

const LNPNumber = {
    number: 22,
    end: "",
    start: "",
    type: "typeLNPTestCypress",
    carrier_id: 0,
    routing_number: "string"
}

context('LNP tests', () => {
    context('UI LNP tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
                apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
                cy.log('Data clean up pre-tests completed')
            })

        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
                apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })

                cy.log('Seeding db...')
                apiCreateLNPCarrier({ data: LNPCarrier, authHeader }).then(({ id }) => {
                    apiCreateLNPNumber({ data: { ...LNPNumber, carrier_id: id }, authHeader })
                })
            })
        })
        
        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
                apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
                cy.log('Data clean up pre-tests completed')
            })
        })

        it('Check if LNP carrier with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
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
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
                apiRemoveLNPCarrierBy({ name: LNPCarrier.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            cy.get('a[data-cy="aui-list-action--add"]').click()

            cy.locationShouldBe('#/lnp/carrier_create')
            cy.get('input[data-cy="lnpcarrier-name"]').type(LNPCarrier.name)
            cy.get('input[data-cy="lnpcarrier-prefix"]').type(LNPCarrier.prefix)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/lnp')
        })

        it('Edit LNP carrier', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpCarrierEdit"]').click()
            waitPageProgress()
            cy.get('input[data-cy="lnpcarrier-prefix"]').clear().type('testdescription')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--prefix"]').should('contain.text', 'testdescription')
        })

        it('Delete LNP carrier and check if they are deleted', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader})
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            deleteItemOnListPageBy(LNPCarrier.name)
        })

        it('Check if LNP Number with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="lnpnumber-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a LNP number', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLNPNumberBy({ number: LNPNumber.number, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
            waitPageProgress()
            
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('input[data-cy="lnpnumber-number"]').type(LNPNumber.number)
            cy.get('input[data-cy="lnpnumber-type"]').type(LNPNumber.type)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit LNP number', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
            waitPageProgress()

            searchInDataTable(LNPNumber.number)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberEdit"]').click()
            waitPageProgress()
            cy.get('input[data-cy="lnpnumber-type"]').type('testtype')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--type"]').should('contain.text', 'testtype')
            cy.log('Not a SPPRO instance, exiting test...')
        })

        it('Delete LNP number and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / lnp')

            cy.locationShouldBe('#/lnp')
            searchInDataTable(LNPCarrier.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--lnpNumberList"]').click()
            waitPageProgress()
            deleteItemOnListPageBy(LNPNumber.number)
        })
    })
})
