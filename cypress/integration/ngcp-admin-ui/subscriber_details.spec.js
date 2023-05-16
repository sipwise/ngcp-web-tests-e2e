/// <reference types="cypress" />

import {
    getRandomNum,
    deleteDownloadsFolder,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem,
    waitPageProgress
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiLoginAsSuperuser,
    apiRemoveCustomerBy,
    apiRemoveDomainBy,
    apiRemoveSubscriberBy
} from '../../support/ngcp-admin-ui/utils/api'

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

const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')

context('Subscriber tests', () => {
    context('UI subscriber tests', () => {
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
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        context('Voicemail settings', () => {
            it('Change voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber-list')

                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('[data-cy=aui-data-table] .q-checkbox').click()
                clickDataTableSelectedMoreMenuItem('subscriberDetails')

                cy.get('[data-cy="aui-main-menu-item--subscriber-details-voicemail-settings"]').click()
                waitPageProgress()

                cy.get('label[data-cy="subscriber-pin"]').type('abcd')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-pin"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-pin"]').clear().type('1234')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('label[data-cy="subscriber-email"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-email"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-email"]').clear().type('test.mail@test.com')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('label[data-cy="subscriber-sms-number"]').type('invalid')
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('[data-cy="subscriber-sms-number"] div[role="alert"]').should('be.visible')
                cy.get('label[data-cy="subscriber-sms-number"]').clear().type('112233')
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                cy.get('[data-cy="subscriber-attach-notification"]').click()
                cy.get('[data-cy="subscriber-delete-after-delivery"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                waitPageProgress()
                cy.get('div[role="alert"]').should('have.class', 'bg-negative')
                cy.get('div[role="alert"] button:last').click()
                cy.get('[data-cy="subscriber-attach-notification"]').click()
                cy.get('[data-cy="aui-save-button"]').click()
                cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            })

            it('Upload/Redownload greetings in voicemail settings', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / subscriber-list')

                cy.locationShouldBe('#/subscriber')
                searchInDataTable(subscriber.username)
                cy.get('[data-cy=aui-data-table] .q-checkbox').click()
                clickDataTableSelectedMoreMenuItem('subscriberDetails')

                cy.get('[data-cy="aui-main-menu-item--subscriber-details-voicemail-settings"]').click()
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
                cy.get('[data-cy="negative-confirmation-dialog"] [data-cy="btn-confirm"]').click()
                cy.get('div[data-cy="aui-sound-file-upload--unavail"] [data-cy="file-select-button"]').should('be.visible')
            })
        })
    })
})
