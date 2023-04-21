/// <reference types="cypress" />

import {
    getRandomNum, waitPageProgress
} from '../../support/ngcp-csc-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy
} from '../../support/ngcp-csc-ui/utils/api'

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

context('Call recordings tests', () => {
    context('UI Call recordings tests', () => {
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

        it('Enable/Disable reminder', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="false"]').should('be.visible')
        })

        it('Set occurance and then enable reminder', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="On weekdays"]').click()
            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="On weekdays"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="Always"]').click()
            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="Always"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
        })

        it('Set time and then enable reminder', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgress()
            cy.get('input[data-cy="csc-reminder-time"]').click()
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-6"]').click()
            cy.wait(1000)
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-9"]').click()
            waitPageProgress()
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', '06:45')
            cy.get('input[data-cy="csc-reminder-time"]').click()
            const time = dayjs().format('HH:mm')
            cy.get('i[class="material-icons q-icon notranslate"]').contains('access_time').click()
            waitPageProgress()
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', time)
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
        })
    })
})
