/// <reference types="cypress" />

import {
    getRandomNum,
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
} from '../../../support/ngcp-csc/e2e'

export const domain = {
    domain: 'domainRecordings',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberRec',
    webusername: 'subscriberRec',
    email: 'subscriberRec@test.com',
    external_id: 'subscriberRec',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 6666
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerRec',
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

context('Call recordings tests', () => {
    context('UI Call recordings tests', () => {
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
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            })
        })

        it('Add timerange to recording filters', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/recordings"]').click()

            cy.get('button').contains('Filter').click()
            cy.get('div[data-cy="csc-call-recording-filters"] label').click()
            cy.get('div[class="q-virtual-scroll__content"]').contains('Timerange').click()
            cy.get('div[class="q-field__prepend q-field__marginal row no-wrap items-center"] i:first').click()
            cy.get('div[class="q-date q-date--portrait q-date--portrait-standard q-date--dark q-dark"]').contains('Close').click()
            cy.get('div[data-cy="q-chip-start-time"]').contains('Start time: ' + dayjs().format('YYYY-MM-DD' + ' 00:00')).should('be.visible')
            cy.get('div[class="q-field__prepend q-field__marginal row no-wrap items-center"] i:last').click()
            cy.get('div[class="q-date q-date--portrait q-date--portrait-standard q-date--dark q-dark"]').contains('Close').click()
            cy.get('div[data-cy="q-chip-end-time"]').contains('End time: ' + dayjs().format('YYYY-MM-DD' + ' 00:00')).should('be.visible')
            cy.get('button').contains('Close filters').click()
            cy.get('div[data-cy="csc-call-recording-filters"]').should('not.exist')
        })

        it('Add caller to recording filters', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/recordings"]').click()

            cy.get('button').contains('Filter').click()
            cy.get('div[data-cy="csc-call-recording-filters"] label').click()
            cy.get('div[class="q-virtual-scroll__content"]').contains('Caller').click()
            cy.get('input[data-cy="csc-recording-filter-input"]').type('testcaller')
            cy.get('div[class="q-field__append q-field__marginal row no-wrap items-center"] i').contains('search').click()
            cy.get('div[data-cy="q-chip-caller"]').contains('Caller: testcaller')
            cy.get('button').contains('Close filters').click()
            cy.get('div[data-cy="csc-call-recording-filters"]').should('not.exist')
        })

        it('Add callee to recording filters', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/recordings"]').click()

            cy.get('button').contains('Filter').click()
            cy.get('div[data-cy="csc-call-recording-filters"] label').click()
            cy.get('div[class="q-virtual-scroll__content"]').contains('Callee').click()
            cy.get('input[data-cy="csc-recording-filter-input"]').type('testcallee')
            cy.get('div[class="q-field__append q-field__marginal row no-wrap items-center"] i').contains('search').click()
            cy.get('div[data-cy="q-chip-callee"]').contains('Callee: testcallee')
            cy.get('button').contains('Close filters').click()
            cy.get('div[data-cy="csc-call-recording-filters"]').should('not.exist')
        })

        it('Add callID to recording filters', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/recordings"]').click()

            cy.get('button').contains('Filter').click()
            cy.get('div[data-cy="csc-call-recording-filters"] label').click()
            cy.get('div[class="q-virtual-scroll__content"]').contains('CallID').click()
            cy.get('input[data-cy="csc-recording-filter-input"]').type('testcallid')
            cy.get('div[class="q-field__append q-field__marginal row no-wrap items-center"] i').contains('search').click()
            cy.get('div[data-cy="q-chip-call-id"]').contains('CallID: testcallid').should('be.visible')
            cy.get('button').contains('Close filters').click()
            cy.get('div[data-cy="csc-call-recording-filters"]').should('not.exist')
        })
    })
})
