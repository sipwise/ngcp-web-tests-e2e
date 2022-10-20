/// <reference types="cypress" />

import {
    getRandomNum
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')
const dayjs = require('dayjs')

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
    webusername: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const loginInfo = {
    username: subscriber.webusername + '@' + subscriber.domain,
    password: subscriber.webpassword
}

context('Dashboard page tests', () => {
    context('UI Dashboard tests', () => {
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
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
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

            cy.get('label[data-cy="filter-from"]').click()
            cy.get('div[class="q-date__calendar-item q-date__calendar-item--in"] span').contains('1').click({ force: true })
            cy.wait(1000)
            cy.get('label[data-cy="filter-to"]').click()
            cy.get('div[class="q-date__calendar-item q-date__calendar-item--in"] span').contains(dayjs().format('DD')).click({ force: true })

            cy.get('div[data-cy="conversations-empty"]').should('contain.text', 'No Calls, Voicemails or Faxes found')
        })
    })
})
