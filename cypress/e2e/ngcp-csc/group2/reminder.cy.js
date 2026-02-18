/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgressCSC,
    getRandomNum
} from '../../../support/e2e'

export const domain = {
    domain: 'domainReminder',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberReminder',
    webusername: 'subscriberReminder',
    email: 'subscriberReminder@test.com',
    external_id: 'subscriberReminder',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 7777
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerReminder',
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

context('Reminder tests', () => {
    context('UI reminder tests', () => {
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

                apiCreateSubscriber({ data: subscriber, authHeader })
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

        it('Enable/Disable reminder', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="false"]').should('be.visible')
        })

        it('Set occurance and then enable reminder', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="On weekdays"]').click()
            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="On weekdays"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="Always"]').click()
            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-occurance"][aria-label="Always"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
        })

        it('Set time and then enable reminder', () => {
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/reminder"]').click()

            waitPageProgressCSC()

            cy.get('button[data-cy="csc-reminder-show-timeselector"]').trigger("click")
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-6"]').click()
            cy.wait(1000)
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-9"]').click()
            waitPageProgressCSC()
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', '06:45')
            cy.get('div[data-cy="csc-reminder-timeselector"] button:first').click()
            const time = dayjs().format('HH:mm')
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', time)
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgressCSC()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
        })
    })
})
