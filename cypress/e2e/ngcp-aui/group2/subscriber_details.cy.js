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
    deleteItemOnListPageBy,
    searchInDataTable,
    waitPageProgress,
    apiCreateSubscriberPhonebook,
    apiRemoveSubscriberPhonebookBy
} from '../../../support/ngcp-aui/e2e'

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

export const domain = {
    reseller_id: 1,
    domain: 'domainSubscriberDetailsCypress'
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
    username: 'subscriberDetailsCypressAui',
    email: 'subscriberDetailsCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain: domain.domain,
    customer_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 9071
    }
}

export const subscriberPhonebook = {
    number: "testnumber",
    subscriber_id: 0,
    name: "SubscriberDetailsPhonebook"
}

let iscloudpbx = false
let issppro = false
const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')

context('Subscriber details tests', () => {
    context('UI subscriber  details tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                iscloudpbx = response.body.cloudpbx === true
                issppro = response.body.type === 'sppro'
            })
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
                        issppro
                            ? apiCreateSubscriberPhonebook({ data: { ...subscriberPhonebook, subscriber_id: id }, authHeader })
                            : cy.log("Instance is CE, not PRO. Skipping Subscriber Phonebook creation...")
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
                issppro
                    ? apiRemoveSubscriberPhonebookBy({ name: subscriberPhonebook.name, authHeader })
                    : cy.log("Instance is CE, not PRO. Skipping Subscriber Phonebook deletion...")
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        context('Voicemail settings', () => {
            it('Change voicemail settings', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')

                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Voicemail Settings').click()
                cy.get('label[data-cy="subscriber-pin"][aria-disabled="true"]').should('not.exist')

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
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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

            it('Check if invalid values are being rejected in Fax Features', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                if (issppro) {
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

            it('Add/Delete Destination to Fax Features', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                if (issppro) {
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

            it('Add/Delete Secret Key Renew Notify Email to Fax Features', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                if (issppro) {
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

            it('Add/Delete ACL to Fax Features', () => {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                if (issppro) {
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

        context('Location mappings', () => {    
            it('Add Location Mapping', () => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveLocationMappingBy({ external_id: locationmapping.external_id, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
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

        context('Phonebook', () => {
            it('Try to create phonebook entry with invalid values', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / subscriber')

                    cy.locationShouldBe('#/subscriber')
                    searchInDataTable(subscriber.username)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    cy.get('a[data-cy="aui-list-action--add"]').click()
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('label[data-cy="phonebook-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('label[data-cy="phonebook-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Create a phonebook', () => {
                if (issppro) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberPhonebookBy({ name: subscriberPhonebook.name, authHeader })
                    })
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / subscriber')

                    cy.locationShouldBe('#/subscriber')
                    searchInDataTable(subscriber.username)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    cy.get('a[data-cy="aui-list-action--add"]').click()
                    cy.get('input[data-cy="phonebook-name"]').type(subscriberPhonebook.name)
                    cy.get('input[data-cy="phonebook-number"]').type(subscriberPhonebook.number)
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('td[data-cy="q-td--name"]').contains(subscriberPhonebook.name).should('be.visible')
                    cy.get('td[data-cy="q-td--number"]').contains(subscriberPhonebook.number).should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Edit a phonebook', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / subscriber')

                    cy.locationShouldBe('#/subscriber')
                    searchInDataTable(subscriber.username)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    searchInDataTable(subscriberPhonebook.name, 'Name')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetailsPhonebookEntryEdit"]').click()
                    cy.get('input[data-cy="phonebook-number"]').clear().type('anothertestnumber')
                    cy.get('button[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('[data-cy="aui-close-button"]').click()
                    cy.get('td[data-cy="q-td--number"]').contains('anothertestnumber').should('be.visible')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })

            it('Delete a phonebook', () => {
                if (issppro) {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / subscriber')

                    cy.locationShouldBe('#/subscriber')
                    searchInDataTable(subscriber.username)
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    cy.get('div[data-cy="aui-detail-page-menu"] div').contains('Phonebook').click()
                    deleteItemOnListPageBy(subscriberPhonebook.name, 'Name')
                } else {
                    cy.log("Instance is CE, not PRO. Skipping phonebook tests...")
                }
            })
        })
    })
})