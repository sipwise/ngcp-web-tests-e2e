/// <reference types="cypress" />

import {
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiLoginAsSuperuser,
    apiRemoveCustomerBy,
    apiRemoveDomainBy,
    apiRemoveSubscriberBy,
    getRandomNum,
    searchInDataTable,
    waitPageProgress,
    apiCreateCFSourceSet,
    apiRemoveCFSourceSetBy,
    deleteItemOnListPageBy,
    apiCreateCFTimeSet,
    apiRemoveCFTimeSetBy,
    apiCreateCFBnumberSet,
    apiRemoveCFBnumberSetBy,
    apiCreateCFDestinationSet,
    apiPutCFMappingByID,
    apiRemoveCFDestinationSetBy
} from '../../../support/ngcp-aui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
const ip = Cypress.config('baseUrl').split('//')[1].split(':')[0]

const sourceset = {
    subscriber_id: 0,
    mode: "whitelist",
    name: "sourcesetCypress",
    sources: [
      {
        source: "regex"
      },
      {
        source: "test"
      }
    ],
    is_regex: true
}

const timeset = {
    name: "timesetCypress",
    times: [
      {
        wday: "Monday",
        minute: "0",
        mday: "20",
        hour: "8",
        month: "April",
        year: "2020"
      },
      {
        wday: "Thursday",
        minute: "0",
        mday: "31",
        hour: "9",
        month: "December",
        year: "2020"
      }
    ],
    subscriber_id: 0
}

const timesetAPI = {
    times: [
      {
        wday: "1-4",
        minute: "0-0",
        mday: "20-31",
        hour: "8-9",
        month: "4-12",
        year: "2020-2020"
      }
    ],
    name: "timesetCypressAPI",
    subscriber_id: 0
}

const bnumberset = {
    mode: "whitelist",
    name: "bnumbersetCypress",
    is_regex: true,
    subscriber_id: 0,
    bnumbers: [
      {
        bnumber: "number"
      },
      {
        bnumber: "test"
      }
    ]
}

const destinationset = {
    destinations: [
        {
          priority: 2,
          timeout: 10,
          destination: "sip:destination@" + ip,
          simple_destination: "destination"
        },
        {
          priority: 1,
          timeout: 20,
          destination: "sip:test@" + ip,
          simple_destination: "test"
        }
      ],
      name: "destinationsetCypress",
      subscriber_id: 0
}

const CFMapping = {
    cfs: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cfb: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cfu: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cfna: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cft: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cft_ringtimeout: 0,
    cfr: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ],
    cfo: [
        {
            enabled: true,
            use_redirection: true,
            sourceset: sourceset.name,
            sourceset_id: 0,
            timeset: timesetAPI.name,
            timeset_id: 0,
            destinationset: destinationset.name,
            destinationset_id: 0,
            bnumberset: bnumberset.name,
            bnumberset_id: 0
        }
        ]
}

const domain = {
    reseller_id: 1,
    domain: 'domainCFCypress'
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: `customerCypressCF`,
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const subscriber = {
    username: 'subscriberCFCypressAui',
    email: 'subscriberCFCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain: domain.domain,
    customer_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 9001
    }
}

context('Subscriber details tests', () => {
    context('UI subscriber  details tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateDomain({ data: domain, authHeader }).then(({ id }) => domain.id = id )
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader }).then(() => {
                    apiCreateSubscriber({ data: subscriber, authHeader }).then(({ id }) => {
                        subscriber.subscriber_id = id
                        apiCreateCFSourceSet({ data: {...sourceset, subscriber_id: id}, authHeader }).then(({ id }) => {
                            CFMapping.cfs[0].sourceset_id = id
                            CFMapping.cfu[0].sourceset_id = id
                            CFMapping.cfb[0].sourceset_id = id
                            CFMapping.cfna[0].sourceset_id = id
                            CFMapping.cft[0].sourceset_id = id
                            CFMapping.cfr[0].sourceset_id = id
                            CFMapping.cfo[0].sourceset_id = id
                        })
                        apiCreateCFTimeSet({ data: {...timesetAPI, subscriber_id: id}, authHeader }).then(({ id }) => {
                            CFMapping.cfs[0].timeset_id = id
                            CFMapping.cfu[0].timeset_id = id
                            CFMapping.cfb[0].timeset_id = id
                            CFMapping.cfna[0].timeset_id = id
                            CFMapping.cft[0].timeset_id = id
                            CFMapping.cfr[0].timeset_id = id
                            CFMapping.cfo[0].timeset_id = id
                        })
                        apiCreateCFBnumberSet({ data: {...bnumberset, subscriber_id: id}, authHeader }).then(({ id }) => {
                            CFMapping.cfs[0].bnumberset_id = id
                            CFMapping.cfu[0].bnumberset_id = id
                            CFMapping.cfb[0].bnumberset_id = id
                            CFMapping.cfna[0].bnumberset_id = id
                            CFMapping.cft[0].bnumberset_id = id
                            CFMapping.cfr[0].bnumberset_id = id
                            CFMapping.cfo[0].bnumberset_id = id
                        })
                        apiCreateCFDestinationSet({ data: {...destinationset, subscriber_id: id}, authHeader }).then(({ id }) => {
                            CFMapping.cfs[0].destinationset_id = id
                            CFMapping.cfu[0].destinationset_id = id
                            CFMapping.cfb[0].destinationset_id = id
                            CFMapping.cfna[0].destinationset_id = id
                            CFMapping.cft[0].destinationset_id = id
                            CFMapping.cfr[0].destinationset_id = id
                            CFMapping.cfo[0].destinationset_id = id
                        })
                        if(Cypress.currentTest.title == 'Add all elements to cfb' || Cypress.currentTest.title == 'Add all elements to cft'){
                            cy.log('Skipping CFMapping. This test requires empty call forwards')
                        } else {
                            apiPutCFMappingByID({ id: subscriber.subscriber_id, data: CFMapping, authHeader})
                        }
                    })
                })
            })
        })

        after(() => {
                Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
                cy.log('Data clean up...')
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: subscriber.username, authHeader }).then(()=> {
                        apiRemoveCFDestinationSetBy({ name: destinationset.name, authHeader })
                        apiRemoveCFTimeSetBy({ name: timesetAPI.name, authHeader })
                        apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                        apiRemoveDomainBy({ name: domain.domain, authHeader })
                    })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCFBnumberSetBy({ name: bnumberset.name, authHeader })
                apiRemoveCFTimeSetBy({ name: timesetAPI.name, authHeader })
                apiRemoveCFSourceSetBy({ name: sourceset.name, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        context('Subscriber call forward settings', () => {
            it('Check if source set with empty values gets rejected', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('SourceSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="aui-sourceset-create-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-sourceset-create-source"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create a source Set', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCFSourceSetBy({ name: sourceset.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('SourceSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="aui-sourceset-create-name"]').type(sourceset.name)
                cy.get('button[data-cy="aui-sourceset-create-source-add"]').click()
                cy.get('input[data-cy="aui-sourceset-create-source"]:first').type(sourceset.sources[0].source)
                cy.get('input[data-cy="aui-sourceset-create-source"]:last').type(sourceset.sources[1].source)
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"] span').contains(sourceset.name).should('be.visible')
                cy.get('td[data-cy="q-td--sources"] span').contains(sourceset.sources[0].source).should('be.visible')
                cy.get('td[data-cy="q-td--sources"] span').contains(sourceset.sources[1].source).should('be.visible')
            })

            it('Edit a source Set', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('SourceSet').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsCallForwardingSourceSetEdit"]').click()
                cy.get('input[data-cy="aui-sourceset-create-source"]:first').clear().type('testing')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--name"] span').contains(sourceset.name).should('be.visible')
                cy.get('td[data-cy="q-td--sources"] span').contains('testing').should('be.visible')
            })

            it('Delete a source Set', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('SourceSet').click()
                waitPageProgress()
                deleteItemOnListPageBy()
            })

            it('Check if timeset with empty values gets rejected', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCFTimeSetBy({ name: timesetAPI.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Time Set').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="aui-create-timeset-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('div[class="error-message"]').contains('Period is required to be filled').should('be.visible')
            })

            it('Create a timeset', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCFTimeSetBy({ name: timesetAPI.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Time Set').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="aui-create-timeset-name"]').type(timeset.name)
                cy.qSelect({ dataCy: 'aui-create-timeset-year', itemContains: timeset.times[0].year })
                cy.qSelect({ dataCy: 'aui-create-timeset-month', itemContains: timeset.times[0].month })
                cy.qSelect({ dataCy: 'aui-create-timeset-day', itemContains: timeset.times[0].mday })
                cy.qSelect({ dataCy: 'aui-create-timeset-weekday', itemContains: timeset.times[0].wday })
                cy.qSelect({ dataCy: 'aui-create-timeset-hour', itemContains: timeset.times[0].hour })
                cy.qSelect({ dataCy: 'aui-create-timeset-year-through', itemContains: timeset.times[1].year })
                cy.qSelect({ dataCy: 'aui-create-timeset-month-through', itemContains: timeset.times[1].month })
                cy.qSelect({ dataCy: 'aui-create-timeset-day-through', itemContains: timeset.times[1].mday })
                cy.qSelect({ dataCy: 'aui-create-timeset-weekday-through', itemContains: timeset.times[1].wday })
                cy.qSelect({ dataCy: 'aui-create-timeset-hour-through', itemContains: timeset.times[1].hour })
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"] span').contains(timeset.name).should('be.visible')
                cy.get('td[data-cy="q-td--times"] span').contains('{ "hour": "8-9", "mday": "20-31", "minute": null, "month": "4-12", "wday": "2-5", "year": "2020-2020" }').should('be.visible')
            })

            it('Edit a timeset', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Time Set').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsCallForwardingTimeSetEdit"]').click()
                cy.qSelect({ dataCy: 'aui-create-timeset-year-through', itemContains: '2021' })
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--name"] span').contains(timesetAPI.name).should('be.visible')
                cy.get('td[data-cy="q-td--times"] span').contains('{ "hour": "8-9", "mday": "20-31", "minute": "0-0", "month": "4-12", "wday": "1-4", "year": "2020-2021" }').should('be.visible')
            })

            it('Delete a timeset', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Time Set').click()
                waitPageProgress()
                deleteItemOnListPageBy()
            })

            it('Check if Bnumber set with empty values gets rejected', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('BNumberSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="aui-create-bnumber-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-create-bnumber-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create a Bnumber set', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCFBnumberSetBy({ name: bnumberset.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('BNumberSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="aui-create-bnumber-name"]').type(bnumberset.name)
                cy.get('button[data-cy="aui-create-bnumber-add"]').click()
                cy.get('input[data-cy="aui-create-bnumber-number"]:first').type(bnumberset.bnumbers[0].bnumber)
                cy.get('input[data-cy="aui-create-bnumber-number"]:last').type(bnumberset.bnumbers[1].bnumber)
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"] span').contains(bnumberset.name).should('be.visible')
                cy.get('td[data-cy="q-td--bnumbers"] span').contains(bnumberset.bnumbers[0].bnumber).should('be.visible')
                cy.get('td[data-cy="q-td--bnumbers"] span').contains(bnumberset.bnumbers[1].bnumber).should('be.visible')
            })

            it('Edit a Bnumber set', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('BNumberSet').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsCallForwardingBNumberSetEdit"]').click()
                cy.get('input[data-cy="aui-create-bnumber-number"]:first').clear().type('testing')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--name"] span').contains(bnumberset.name).should('be.visible')
                cy.get('td[data-cy="q-td--bnumbers"] span').contains('testing').should('be.visible')
            })

            it('Delete a Bnumber set', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('BNumberSet').click()
                waitPageProgress()
                deleteItemOnListPageBy()
            })

            it('Check if destinationset with empty values gets rejected', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('DestinationSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="aui-create-destination-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-create-destination-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            })

            it('Create a destinationset', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveCFDestinationSetBy({ name: destinationset.name, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('DestinationSet').click()
                waitPageProgress()
                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="aui-create-destination-name"]').type(destinationset.name)
                cy.get('button[data-cy="aui-create-destination-add"]').click()
                cy.get('input[data-cy="aui-create-destination-number"]:first').type(destinationset.destinations[0].simple_destination)
                cy.get('div[data-cy="aui-create-destination-type"]:last').click()
                cy.wait(200)
                cy.get('div[data-cy="q-item-label"] span').contains('URI/Number').click({ force: true })
                cy.get('input[data-cy="aui-create-destination-number"]:last').type(destinationset.destinations[1].simple_destination)
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('td[data-cy="q-td--name"] span').contains(destinationset.name).should('be.visible')
                cy.get('td[data-cy="q-td--destinations"] span').contains(destinationset.destinations[0].simple_destination).should('be.visible')
                cy.get('td[data-cy="q-td--destinations"] span').contains(destinationset.destinations[1].simple_destination).should('be.visible')
            })

            it('Edit a destinationset', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('DestinationSet').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsCallForwardingDestinationSetEdit"]').click()
                cy.get('input[data-cy="aui-create-destination-number"]:first').clear().type('testing')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="aui-close-button"]').click()
                cy.get('td[data-cy="q-td--name"] span').contains(destinationset.name).should('be.visible')
                cy.get('td[data-cy="q-td--destinations"] span').contains('testing').should('be.visible')
            })

            it('Delete a destinationset', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('DestinationSet').click()
                waitPageProgress()
                deleteItemOnListPageBy()
            })

            it('Add all elements to cfb', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Busy').click()
                waitPageProgress()
                cy.auiSelectLazySelect({ dataCy: 'aui-cfbusy-destinationset-destination', filter: destinationset.name, itemContains: destinationset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cfbusy-timeset-time', filter: timeset.name, itemContains: timeset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cfbusy-sourceset-source', filter: sourceset.name, itemContains: sourceset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cfbusy-bnumber', filter: bnumberset.name, itemContains: bnumberset.name })
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-destinationset-destination"] span').contains(destinationset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-timeset-time"] span').contains(timeset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"] span').contains(sourceset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-bnumber"] span').contains(bnumberset.name).should('be.visible')
            })

            it('Add all elements to cft', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Timeout').click()
                waitPageProgress()
                cy.get('input[data-cy="aui-cftimeout-ringtimeout"]').clear().type(10)
                cy.auiSelectLazySelect({ dataCy: 'aui-cftimeout-destinationset-destination', filter: destinationset.name, itemContains: destinationset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cftimeout-timeset-time', filter: timeset.name, itemContains: timeset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cftimeout-sourceset-source', filter: sourceset.name, itemContains: sourceset.name })
                cy.auiSelectLazySelect({ dataCy: 'aui-cftimeout-bnumber', filter: bnumberset.name, itemContains: bnumberset.name })
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('input[data-cy="aui-cftimeout-ringtimeout"][value="10"]').should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-destinationset-destination"] span').contains(destinationset.name).should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-timeset-time"] span').contains(timeset.name).should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-sourceset-source"] span').contains(sourceset.name).should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-bnumber"] span').contains(bnumberset.name).should('be.visible')
            })

            it('Check if popup appears when clicking "add" button inside cfb', () =>{
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Busy').click()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-bnumber"]').find('i[aria-label="Clear"]').click()
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"]').find('i[aria-label="Clear"]').click()
                cy.get('label[data-cy="aui-cfbusy-destinationset-destination"] button:first').click()
                cy.get('button[data-cy="btn-confirm"]').click()
                cy.get('button[data-cy="aui-close-button"]').click()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-destinationset-destination"] span').contains(destinationset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-timeset-time"] span').contains(timeset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"] span').contains(sourceset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-bnumber"] span').contains(bnumberset.name).should('be.visible')
            })

            it('Edit cfb', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Busy').click()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-timeset-time"]').find('i[aria-label="Clear"]').click()
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"]').find('i[aria-label="Clear"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-destinationset-destination"] span').contains(destinationset.name).should('be.visible')
                cy.get('label[data-cy="aui-cfbusy-timeset-time"] span').contains(timeset.name).should('not.exist')
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"] span').contains(sourceset.name).should('not.exist')
                cy.get('label[data-cy="aui-cfbusy-bnumber"] span').contains(bnumberset.name).should('be.visible')
            })

            it('Edit cfb via summary menu', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--more-menu-left"]').eq(1).click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsCallForwardingBusyEdit').click()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-bnumber"]').find('i[aria-label="Clear"]').click()
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"]').find('i[aria-label="Clear"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('button[data-cy="aui-close-button"]').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--mappings"] span').eq(7).contains('null').should('exist')
                cy.get('td[data-cy="q-td--mappings"] span').eq(8).contains('null').should('exist')
            })

            it('Edit cft', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Timeout').click()
                waitPageProgress()
                cy.get('input[data-cy="aui-cftimeout-ringtimeout"]').clear().type(20)
                cy.get('label[data-cy="aui-cftimeout-timeset-time"]').find('i[aria-label="Clear"]').click()
                cy.get('label[data-cy="aui-cftimeout-sourceset-source"]').find('i[aria-label="Clear"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('input[data-cy="aui-cftimeout-ringtimeout"][value="20"]').should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-destinationset-destination"] span').contains(destinationset.name).should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-timeset-time"] span').contains(timeset.name).should('not.exist')
                cy.get('label[data-cy="aui-cftimeout-sourceset-source"] span').contains(sourceset.name).should('not.exist')
                cy.get('label[data-cy="aui-cftimeout-bnumber"] span').contains(bnumberset.name).should('be.visible')
            })

            it('Delete cfb', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Busy').click()
                waitPageProgress()
                cy.get('button[data-cy="aui-cfbusy-delete"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('label[data-cy="aui-cfbusy-destinationset-destination"] span').contains(destinationset.name).should('not.exist')
                cy.get('label[data-cy="aui-cfbusy-timeset-time"] span').contains(timeset.name).should('not.exist')
                cy.get('label[data-cy="aui-cfbusy-sourceset-source"] span').contains(sourceset.name).should('not.exist')
                cy.get('label[data-cy="aui-cfbusy-bnumber"] span').contains(bnumberset.name).should('not.exist')
            })

            it('Delete cfb via summary menu', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--more-menu-left"]').eq(1).click()
                cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
                cy.get('button[data-cy="btn-confirm"]').click()
                waitPageProgress()
                cy.get('td[data-cy="q-td--mappings"] span').eq(6).contains('[]').should('exist')
                cy.get('td[data-cy="q-td--mappings"] span').eq(7).contains('[]').should('exist')
                cy.get('td[data-cy="q-td--mappings"] span').eq(8).contains('[]').should('exist')
                cy.get('td[data-cy="q-td--mappings"] span').eq(9).contains('[]').should('exist')
            })

            it('Delete cft', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                waitPageProgress()
                cy.get('div[data-cy="q-item-label"]').contains('Timeout').click()
                waitPageProgress()
                cy.get('button[data-cy="aui-cftimeout-delete"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.reload()
                waitPageProgress()
                cy.get('input[data-cy="aui-cftimeout-ringtimeout"][value="15"]').should('be.visible')
                cy.get('label[data-cy="aui-cftimeout-destinationset-destination"] span').contains(destinationset.name).should('not.exist')
                cy.get('label[data-cy="aui-cftimeout-timeset-time"] span').contains(timeset.name).should('not.exist')
                cy.get('label[data-cy="aui-cftimeout-sourceset-source"] span').contains(sourceset.name).should('not.exist')
                cy.get('label[data-cy="aui-cftimeout-bnumber"] span').contains(bnumberset.name).should('not.exist')
            })
        })
    })
})
