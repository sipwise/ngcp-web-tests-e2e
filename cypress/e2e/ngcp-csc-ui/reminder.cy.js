/// <reference types="cypress" />

import { customer, domain, loginInfo, subscriber } from '../../support/csc-test-data';
import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgress
} from '../../support/ngcp-csc-ui/e2e'

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
            cy.get('button[data-cy="csc-reminder-show-timeselector"]').click()
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-6"]').click()
            cy.wait(1000)
            cy.get('div[class="q-time__clock-position row flex-center q-time__clock-pos-9"]').click()
            waitPageProgress()
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', '06:45')
            cy.get('div[data-cy="csc-reminder-timeselector"] button:first').click()
            waitPageProgress()
            const time = dayjs().format('HH:mm')
            cy.get('input[data-cy="csc-reminder-time"]').should('have.value', time)
            cy.get('div[data-cy="csc-reminder-toggle"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-reminder-toggle"][aria-checked="true"]').should('be.visible')
        })
    })
})
