/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    getRandomNum,
} from '../../../support/ngcp-csc/e2e'

export const domain = {
    domain: 'domainDash',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberDash',
    webusername: 'subscriberDash',
    email: 'subscriberDash@test.com',
    external_id: 'subsubscriberDash',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 4444
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerDash',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const ngcpConfig = Cypress.config('ngcpConfig')
const dayjs = require('dayjs')

context('Dashboard page tests', () => {
    context('UI Dashboard tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                     subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiCreateSubscriber({ data:  subscriber, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Check if links in Dashboard work properly', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="dashboard-view-voicebox"] a').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Voicemails found')
            cy.get('a[href="#/user/dashboard"]').click()

            cy.get('div[data-cy="dashboard-view-calllist"] a').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls found')
            cy.get('a[href="#/user/dashboard"]').click()

            cy.get('div[data-cy="dashboard-view-registered-devices"] a').click()
            cy.get('main[id="csc-page-pbx-settings"]').should('be.visible')
        })

        it('Make a test call', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('a[href="#/user/home"]').click()
            cy.get('input[data-cy="csc-call-number-input"]').type('testcontact')
            cy.get('button[data-cy="start-call"]').click()

            cy.get('div[class="csc-phone-number"] span').should('contain.text', 'Calling testcontact...')
            cy.get('button[data-cy="end-call"]').click()
            cy.get('input[data-cy="csc-call-number-input"]').should('be.visible')
        })

        it('Try to acces every page in conversations tab', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('a[href="#/user/conversations"]:first').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls, Voicemails or Faxes found')

            cy.get('div[data-cy="q-tab-call"]').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls found')

            cy.get('div[data-cy="q-tab-voicemail"]').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Voicemails found')

            cy.get('div[data-cy="q-tab-fax"]').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Faxes found')

            cy.get('div[data-cy="q-tab-call-fax-voicemail"]').click()
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls, Voicemails or Faxes found')

            cy.get('input[data-cy="filter-from"]').click()
            cy.get('div[class="q-date__calendar-item q-date__calendar-item--in"] span').contains('1').click({ force: true })
            cy.wait(1000)
            cy.get('input[data-cy="filter-to"]').click()
            cy.get('div[class="q-date__calendar-item q-date__calendar-item--in"] span').contains(dayjs().format('D')).click({ force: true })
            cy.wait(1000)
            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls, Voicemails or Faxes found')
        })
    })
})
