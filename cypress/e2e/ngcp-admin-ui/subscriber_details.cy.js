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
    waitPageProgress,
    clickDataTableSelectedMoreMenuItem
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customer' + getRandomNum(),
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const domain = {
    domain: 'domain' + getRandomNum(),
    reseller_id: 1
}

const subscriber = {
    username: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const locationmapping = {
    external_id: 'location' + getRandomNum() + 'id',
    mode: 'add',
    location: 'location' + getRandomNum(),
    to_username: 'user' + getRandomNum(),
    caller_pattern: 'caller' + getRandomNum(),
    callee_pattern: 'callee' + getRandomNum(),
    subscriber_id: 0,
    enabled: true
}

const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')

context('Subscriber Details tests', () => {
    context('UI subscriber  details tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriber({ data: subscriber, authHeader }).then(({ id }) => {
                    subscriber.subscriber_id = id
                    apiCreateLocationMapping({ data: { ...locationmapping, subscriber_id: id }, authHeader })
                })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
            deleteDownloadsFolder()
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveLocationMappingBy({ name: locationmapping.external_id, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        context('Voicemail settings', () => {
            it('Change voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')

                waitPageProgress()
                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('div[class="aui-data-table"] .q-checkbox').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                cy.get('div[data-cy="aui-detail-page-menu"]').contains('Voicemail Settings').click()
                waitPageProgress()

                cy.get('label[data-cy="subscriber-pin"]').type('abcd')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-pin"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-pin"]').clear()
                cy.get('label[data-cy="subscriber-pin"]').type('1234')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="subscriber-email"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('label[data-cy="subscriber-email"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-email"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-email"]').clear()
                cy.get('label[data-cy="subscriber-email"]').type('test.mail@test.com')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('label[data-cy="subscriber-sms-number"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('label[data-cy="subscriber-sms-number"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-sms-number"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-sms-number"]').clear()
                cy.get('label[data-cy="subscriber-sms-number"]').type('112233')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[data-cy="subscriber-delete-after-delivery"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[data-cy="subscriber-delete-after-delivery"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[data-cy="subscriber-attach-notification"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('div[data-cy="subscriber-attach-notification"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            })

            it('Upload/Redownload greetings in voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')

                waitPageProgress()
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
                cy.readFile(filename, 'binary', { timeout: 1000 }).should(buffer => expect(buffer.length).to.be.gt(8400))
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-delete-button"]').click()
                cy.get('button[data-cy="btn-confirm"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-select-button"]').should('be.visible')
            })

            it('Check if invalid values are being rejected in Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')

                        waitPageProgress()
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
                        waitPageProgress()
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

            it('Add/Delete Renew Notify Email to Fax Features', () => {
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        cy.navigateMainMenu('settings / subscriber')
                        waitPageProgress()
                        cy.locationShouldBe('#/subscriber')
                        searchInDataTable(subscriber.username)
                        cy.get('div[class="aui-data-table"] .q-checkbox').click()
                        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                        cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()

                        cy.get('div[data-cy="aui-detail-page-menu"]').contains('Fax Features').click()
                        cy.get('div[data-cy="mailtofax-enable"]').click()
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
                        waitPageProgress()

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
                    apiRemoveLocationMappingBy({ name: locationmapping.external_id, authHeader })
                })
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                waitPageProgress()

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
                waitPageProgress()

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
                cy.get('label[data-cy="locationmapping-location"] button').contains('cancel').click()
                cy.get('input[data-cy="locationmapping-location"]').type('newtestlocation')
                cy.get('label[data-cy="locationmapping-caller_pattern"] button').contains('cancel').click()
                cy.get('input[data-cy="locationmapping-caller_pattern"]').type('newtestcallerpattern')
                cy.get('label[data-cy="locationmapping-callee_pattern"] button').contains('cancel').click()
                cy.get('input[data-cy="locationmapping-callee_pattern"]').type('newtestcalleepattern')
                cy.qSelect({ dataCy: 'locationmapping-mode', filter: 'Add', itemContains: 'Add' })
                cy.get('label[data-cy="locationmapping-to_username"] button').contains('cancel').click()
                cy.get('input[data-cy="locationmapping-to_username"]').type('newtestusername')
                cy.get('div[aria-label="Enabled"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('button[data-cy="aui-close-button"][aria-disabled="true"]').should('not.exist')
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Delete Location Mapping', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber')
                waitPageProgress()

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
