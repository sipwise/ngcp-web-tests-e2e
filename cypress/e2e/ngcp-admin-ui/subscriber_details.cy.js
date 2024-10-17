/// <reference types="cypress" />

import {
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateLocationMapping,
    apiCreateSubscriber,
    apiLoginAsSuperuser,
    apiRemoveCustomerBy,
    apiRemoveDomainBy,
    apiRemoveLocationMappingBy,
    apiRemoveSubscriberBy,
    getRandomNum,
    deleteDownloadsFolder,
    searchInDataTable,
    waitPageProgress
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

const locationmapping = {
    external_id: 'locationCypressId',
    mode: 'add',
    location: 'location' + getRandomNum(),
    to_username: 'user' + getRandomNum(),
    caller_pattern: 'caller' + getRandomNum(),
    callee_pattern: 'callee' + getRandomNum(),
    subscriber_id: 0,
    enabled: true
}

const bnumberset = {
    subscriber_id: 0,
    mode: "whitelist",
    name: "bnumbersetCypress",
    bnumbers: [
        {
        bnumber: getRandomNum()
        }
    ],
    is_regex: true
}

const destinationset = {
    subscriber_id: 0,
    name: "destinationsetCypress",
    destinations: [
        {
        simple_destination: "string",
        priority: 0,
        timeout: 0,
        announcement_id: 0,
        destination: "number" + getRandomNum()
        }
    ]
}

const sourceset = {
    subscriber_id: 0,
    mode: "whitelist",
    name: "sourcesetCypress",
    sources: [
      {
        source: "regex"
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

export const domain = {
    reseller_id: 1,
    domain: 'domainCypress'
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: `customerCypress`,
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const subscriber = {
    username: 'subscriberCypressAui',
    email: 'subscriberCypressAui@test.com',
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


const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')

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
                        apiCreateLocationMapping({ data: { ...locationmapping, subscriber_id: id }, authHeader })
                    })
                })
            })
        })

        after(() => {
                Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
                cy.log('Data clean up...')
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: subscriber.username, authHeader }).then(()=> {
                        apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                        apiRemoveDomainBy({ name: domain.domain, authHeader })
                    })
            })
            deleteDownloadsFolder()
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLocationMappingBy({ external_id: locationmapping.external_id, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        context('Voicemail settings', () => {
            it('Change voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')

                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Voicemail Settings').click()
                cy.get('label[data-cy="subscriber-pin"][aria-disabled="true"]').should('not.exist')
                
                // Testing the Voicemail testing form
                cy.get('input[data-cy="subscriber-pin"]').type('abc')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-pin"] div[role="alert"]').should('be.visible')
                cy.get('input[data-cy="subscriber-pin"]').clear()
                cy.get('input[data-cy="subscriber-pin"]').type('1234')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="subscriber-email"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[role="alert"][class^="bg-negative"]').should('not.exist')
                cy.get('label[data-cy="subscriber-email"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-email"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-email"]').clear()
                cy.get('label[data-cy="subscriber-email"]').type('test.mail@test.com')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="subscriber-sms-number"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[role="alert"][class^="bg-negative"]').should('not.exist')
                cy.get('label[data-cy="subscriber-sms-number"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-sms-number"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-sms-number"]').clear()
                cy.get('label[data-cy="subscriber-sms-number"]').type('112233')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[data-cy="subscriber-delete-after-delivery"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[role="alert"][class^="bg-negative"]').should('not.exist')
                cy.get('div[data-cy="subscriber-delete-after-delivery"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[data-cy="subscriber-attach-notification"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[role="alert"][class^="bg-negative"]').should('not.exist')
                cy.get('div[data-cy="subscriber-attach-notification"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Upload/Redownload greetings in voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')

                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Voicemail Settings').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: 'true' })
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-reset-button"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-select-button"]').should('be.visible')
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: 'true' })
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-upload-button"]').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-play-button"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-pause-button"]').should('be.visible')
                cy.wait(2000)
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-pause-button"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-play-button"]').should('be.visible')
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-stop-button"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="player-download-button"]').click()
                const filename = path.join(downloadsFolder, 'voicemail_unavail_' + subscriber.subscriber_id + '.wav')
                cy.readFile(filename, 'binary', { timeout: 5000 }).should(buffer => expect(buffer.length).to.be.gt(8400))
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-delete-button"]').click()
                cy.get('button[data-cy="btn-confirm"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-select-button"]').should('be.visible')
            })

            it('Create/Delete Unconditional Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                        waitPageProgress()
                        cy.get('div[data-cy="q-item-label"]').contains('Unconditional').click()
                        waitPageProgress()
                        cy.get('div[data-cy="aui-cfunconditional-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunconditional-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfunconditional-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfunconditional-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfunconditional-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfunconditional-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfunconditional-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfunconditional-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfunconditional-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunconditional-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfunconditional-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfunconditional-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfunconditional-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfunconditional-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunconditional-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfunconditional-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfunconditional-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfunconditional-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('Unconditional').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cfunconditional-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"] .').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete Busy Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
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
                        cy.get('div[data-cy="aui-cfbusy-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfbusy-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfbusy-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfbusy-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfbusy-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfbusy-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfbusy-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfbusy-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfbusy-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfbusy-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfbusy-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfbusy-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfbusy-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfbusy-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfbusy-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfbusy-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfbusy-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfbusy-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('Busy').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cfbusy-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete Timeout Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
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
                        cy.get('div[data-cy="aui-cftimeout-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cftimeout-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cftimeout-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cftimeout-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cftimeout-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cftimeout-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cftimeout-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cftimeout-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cftimeout-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cftimeout-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cftimeout-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cftimeout-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cftimeout-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cftimeout-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cftimeout-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cftimeout-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cftimeout-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cftimeout-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('Timeout').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cftimeout-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete Unavailable Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                        waitPageProgress()
                        cy.get('div[data-cy="q-item-label"]').contains('Unavailable').click()
                        waitPageProgress()
                        cy.get('div[data-cy="aui-cfunavailable-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunavailable-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfunavailable-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfunavailable-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfunavailable-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfunavailable-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfunavailable-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfunavailable-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfunavailable-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunavailable-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfunavailable-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfunavailable-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfunavailable-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfunavailable-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfunavailable-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfunavailable-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfunavailable-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfunavailable-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('Unavailable').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cfunavailable-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete SMS Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                        waitPageProgress()
                        cy.get('div[data-cy="q-item-label"]').contains('Sms').click()
                        waitPageProgress()
                        cy.get('div[data-cy="aui-cfsms-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfsms-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfsms-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfsms-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfsms-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfsms-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfsms-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfsms-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfsms-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfsms-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfsms-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfsms-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfsms-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfsms-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfsms-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfsms-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfsms-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfsms-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('Sms').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cfsms-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete On Response Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                        waitPageProgress()
                        cy.get('div[data-cy="q-item-label"]').contains('On Response').click()
                        waitPageProgress()
                        cy.get('div[data-cy="aui-cfresponse-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfresponse-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfresponse-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfresponse-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfresponse-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfresponse-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfresponse-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfresponse-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfresponse-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfresponse-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfresponse-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfresponse-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfresponse-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfresponse-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfresponse-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfresponse-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfresponse-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfresponse-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        waitPageProgress()
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                        cy.get('div[data-cy="q-item-label"]').contains('On Response').click()
                        waitPageProgress()
                        cy.get('button[data-cy="aui-cfresponse-delete"]').click()
                        cy.get('button[data-cy="aui-save-button"]').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        // cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("not.exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("not.exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Create/Delete On Overflow Call Forward with Source, Time, BNumber and Destination Set', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Call Forwarding').click()
                        waitPageProgress()
                        cy.get('div[data-cy="q-item-label"]').contains('On Overflow').click()
                        waitPageProgress()
                        cy.get('div[data-cy="aui-cfoverflow-destinationset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfoverflow-destinationset-destination', itemContains: 'New DestinationSet' })
                        cy.get('input[data-cy="aui-cfoverflow-destination-name"]').type(destinationset.name)
                        cy.get('input[data-cy="aui-cfoverflow-destination-number"]').type(destinationset.destinations[0].destination)
                        cy.get('div[data-cy="aui-cfoverflow-timeset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-time', itemContains: 'New TimeSet' })
                        cy.get('input[data-cy="aui-cfoverflow-timeset-name"]').type(timeset.name)
                        cy.get('label[data-cy="aui-cfoverflow-timeset-year"]').scrollIntoView()
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-year', itemContains: timeset.times[0].year})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-month', itemContains: timeset.times[0].month})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-day', itemContains: timeset.times[0].mday})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-weekday', itemContains: timeset.times[0].wday})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-hour', itemContains: timeset.times[0].hour})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-minute', itemContains: timeset.times[0].minute})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-year-through', itemContains: timeset.times[1].year})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-month-through', itemContains: timeset.times[1].month})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-day-through', itemContains: timeset.times[1].mday})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-weekday-through', itemContains: timeset.times[1].wday})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-hour-through', itemContains: timeset.times[1].hour})
                        cy.qSelect({ dataCy: 'aui-cfoverflow-timeset-minute-through', itemContains: timeset.times[1].minute})
                        cy.get('div[data-cy="aui-cfoverflow-sourceset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfoverflow-sourceset-source', itemContains: 'New SourceSet' })
                        cy.get('input[data-cy="aui-cfoverflow-source-name"]').type(sourceset.name)
                        cy.get('div[data-cy="aui-cfoverflow-sourceset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfoverflow-source"]').type(sourceset.sources[0].source)
                        cy.get('div[data-cy="aui-cfoverflow-bnumberset"]').click()
                        cy.wait(500)
                        cy.qSelect({ dataCy: 'aui-cfoverflow-bnumber', itemContains: 'New B-NumberSet' })
                        cy.get('input[data-cy="aui-cfoverflow-bnumber-name"]').type(bnumberset.name)
                        cy.get('div[data-cy="aui-cfoverflow-bnumberset-isregex"]').click()
                        cy.get('input[data-cy="aui-cfoverflow-bnumberset-bnumber"]').type(bnumberset.bnumbers[0].bnumber)
                        cy.get('button[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('div[data-cy="q-item-label"]').contains('Summary').click()
                        // TODO fix this: the GET to retrieve the Summary Details seems to happen
                        // before the PUT to delete the data
                        // waitPageProgress()
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(destinationset.name).should("exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(timeset.name).should("exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(sourceset.name).should("exist")
                        // cy.get('span[data-cy="aui-data-table-highlighted-text--4"]').contains(bnumberset.name).should("exist")
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Check if invalid values are being rejected in Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Fax Features').click()
                        cy.get('[data-cy="destination-add"]').click()
                        cy.get('input[data-cy="destination-email"]').type('notavalidemail')
                        cy.get('[data-cy="aui-save-button"]').click()
                        cy.get('div[role="alert"]').should('have.class', 'bg-negative')
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Add/Delete Destination to Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Fax Features').click()
                        cy.get('[data-cy="faxserversettings-enable"]').click()
                        cy.get('[data-cy="faxserversettings-t38"]').click()
                        cy.get('[data-cy="faxserversettings-ecm"]').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        cy.get('div[data-cy="faxserversettings-t38"][aria-disabled="true"]').should('not.exist')
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('[data-cy="destination-add"]').click()
                        cy.get('input[data-cy="destination-email"]').type('test.mail@invalid.com')
                        cy.get('label[data-cy="destination-filetype"]').click()
                        cy.get('div[role="listbox"]').contains('TIFF').click()
                        cy.get('[data-cy="destination-deliver-incoming"]').click()
                        cy.get('[data-cy="destination-deliver-outgoing"]').click()
                        cy.get('[data-cy="destination-receive-reports"]').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        cy.get('div[data-cy="faxserversettings-t38"][aria-disabled="true"]').should('not.exist')
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('[data-cy="destination-add"]').click()
                        cy.get('input[data-cy="destination-email"]:last').type('test.mail2@invalid.com')
                        cy.get('label[data-cy="destination-filetype"]:last').click()
                        cy.get('div[role="listbox"]').contains('TIFF').click()
                        cy.get('[data-cy="destination-deliver-incoming"]:last').click()
                        cy.get('[data-cy="destination-deliver-outgoing"]:last').click()
                        cy.get('[data-cy="destination-receive-reports"]:last').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        cy.get('div[data-cy="faxserversettings-t38"][aria-disabled="true"]').should('not.exist')
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="destination-delete"]:last').click()
                        cy.get('button[data-cy="destination-delete"]:last').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        cy.get('div[data-cy="faxserversettings-t38"][aria-disabled="true"]').should('not.exist')
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Add/Delete Secret Key Renew Notify Email to Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Fax Features').click()
                        cy.get('div[data-cy="mailtofax-enable"]').click()
                        cy.get('input[data-cy="mailtofax-input-secret-key"]').type('testkey')
                        cy.get('label[data-cy="mailtofax-secret-key-renew-interval"]').click()
                        cy.get('div[role="listbox"]').contains('Monthly').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="secret-key-reniew-notify-add"]').click()
                        cy.get('input[data-cy="secret-key-notify-email"]').type('test.mail@invalid.com')
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="secret-key-reniew-notify-add"]').click()
                        cy.get('input[data-cy="secret-key-notify-email"]:last').type('test.mail2@invalid.com')
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="secret-key-reniew-notify-delete"]:last').click()
                        cy.get('button[data-cy="secret-key-reniew-notify-delete"]').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Add/Delete ACL to Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Fax Features').click()
                        cy.get('button[data-cy="acl-add"]').scrollIntoView()
                        cy.get('button[data-cy="acl-add"]').click({ force: true })
                        cy.get('label[data-cy="acl-from-email"]').type('test.mail@test.com')
                        cy.get('input[data-cy="acl-received-from-ip"]').type('10.0.0.10')
                        cy.get('input[data-cy="acl-destination"]').type('0123456789')
                        cy.get('div[data-cy="acl-regex-enable"]').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="acl-add"]').scrollIntoView()
                        cy.get('button[data-cy="acl-add"]').click({ force: true })
                        cy.get('label[data-cy="acl-from-email"]:last').type('test.mail2@test.com')
                        cy.get('input[data-cy="acl-received-from-ip"]:last').type('10.0.0.11')
                        cy.get('input[data-cy="acl-destination"]:last').type('012345678')
                        cy.get('div[data-cy="acl-regex-enable"]:last').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                        cy.get('button[data-cy="acl-delete"]:last').click()
                        cy.get('button[data-cy="acl-delete"]').click()
                        cy.get('[data-cy="aui-save-button"]').click()
                        waitPageProgress()
                        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    } else {
                        cy.log('Not a SPPRO instance, exiting test...')
                    }
                })
            })

            it('Add Location Mapping', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveLocationMappingBy({ external_id: locationmapping.external_id, authHeader })
                })
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Location Mappings').click()
                waitPageProgress()
                cy.get('div[data-cy="aui-list-action--add"]').click()
                cy.get('input[data-cy="locationmapping-location"]').type('testlocation')
                cy.get('input[data-cy="locationmapping-caller_pattern"]').type('testcallerpattern')
                cy.get('input[data-cy="locationmapping-callee_pattern"]').type('testcalleepattern')
                cy.qSelect({ dataCy: 'locationmapping-mode', filter: 'Forward', itemContains: 'Forward' })
                cy.get('input[data-cy="locationmapping-to_username"]').type('testusername')
                cy.get('input[data-cy="locationmapping-external_id"]').type(locationmapping.external_id)
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Edit Location Mapping', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Location Mappings').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberLocationMappingsEdit"]').click()
                cy.get('label[data-cy="locationmapping-location"] i').contains('cancel')
                cy.get('input[data-cy="locationmapping-location"]').type('newtestlocation')
                cy.get('label[data-cy="locationmapping-caller_pattern"] i').contains('cancel')
                cy.get('input[data-cy="locationmapping-caller_pattern"]').type('newtestcallerpattern')
                cy.get('label[data-cy="locationmapping-callee_pattern"] i').contains('cancel')
                cy.get('input[data-cy="locationmapping-callee_pattern"]').type('newtestcalleepattern')
                cy.qSelect({ dataCy: 'locationmapping-mode', filter: 'Add', itemContains: 'Add' })
                cy.get('label[data-cy="locationmapping-to_username"] i').contains('cancel')
                cy.get('input[data-cy="locationmapping-to_username"]').type('newtestusername')
                cy.get('div[aria-label="Enabled"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('button[data-cy="aui-close-button"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Delete Location Mapping', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Location Mappings').click()
                waitPageProgress()
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--delete"]').click()
                cy.get('button[data-cy="btn-confirm"]').click()
                cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
            })
        })
    })
})
