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
    apiRemoveSubscriberPhonebookBy,
    apiCreateSubscriberPhonebook
} from '../../../support/e2e'

export const domain = {
    domain: 'domainSubscriberPhonebook',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberPhonebook',
    webusername: 'subscriberPhonebook',
    email: 'subscriberPhonebook@test.com',
    external_id: 'subscriberPhonebook',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 10
    },
}

export const subscriberSharedPhonebook = {
    username: 'subscriberPhonebookShared',
    webusername: 'subscriberPhonebookShared',
    email: 'subscriberPhonebookShared@test.com',
    external_id: 'subscriberPhonebookShared',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 20
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerSubscriberPhonebook',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

export const subscriberPhonebookEntry = {
    number: "testnumber",
    subscriber_id: 0,
    name: "cscSubscriberPhonebook",
    shared: false
}

export const secondSubscriberPhonebookEntry = {
    number: "secondtestnumber",
    subscriber_id: 0,
    name: "SecondSubscriberPhonebook",
    shared: true
}

const ngcpConfig = Cypress.config('ngcpConfig')
let issppro = null

context('Subscriber phonebook tests', () => {
    context('UI Subscriber phonebook tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSubscriberBy({ name: subscriberSharedPhonebook.username, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                     subscriber.customer_id = id
                     subscriberSharedPhonebook.customer_id = id
                })
                apiCreateSubscriber({ data: subscriber, authHeader })
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.visit('/')
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        issppro = true
                        apiRemoveSubscriberPhonebookBy({name: secondSubscriberPhonebookEntry.name, authHeader})
                        apiRemoveSubscriberPhonebookBy({name: subscriberPhonebookEntry.name, authHeader})
                    } else {
                        cy.log('Skipping all tests, because this is not an SPPRO instance');
                        issppro = false
                        return
                    }
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriberSharedPhonebook.username, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                if (issppro) {
                    apiRemoveSubscriberPhonebookBy({name: secondSubscriberPhonebookEntry.name, authHeader})
                    apiRemoveSubscriberPhonebookBy({name: subscriberPhonebookEntry.name, authHeader})
                    apiCreateSubscriber({ data: subscriber, authHeader }).then(({ id }) => {
                        apiCreateSubscriberPhonebook({data: { ...subscriberPhonebookEntry, subscriber_id: id }, authHeader})
                        secondSubscriberPhonebookEntry.subscriber_id = id
                    })
                }
                apiCreateSubscriber({ data: subscriberSharedPhonebook, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                if (issppro) {
                    apiRemoveSubscriberPhonebookBy({name: secondSubscriberPhonebookEntry.name, authHeader})
                    apiRemoveSubscriberPhonebookBy({name: subscriberPhonebookEntry.name, authHeader})
                }
                apiRemoveSubscriberBy({ name: subscriberSharedPhonebook.username, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Create subscriber phonebook entry', function () {
            if (!issppro) {
                this.skip()
            }
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberPhonebookBy({name: subscriberPhonebookEntry.name, authHeader})
            })
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('button[data-cy="csc-phonebook-add"]').click()

            cy.get('input[data-cy="csc-phonebook-add-name"]').type(subscriberPhonebookEntry.name)
            cy.get('input[data-cy="csc-phonebook-add-number"]').type(subscriberPhonebookEntry.number)
            cy.get('button[data-cy="csc-phonebook-add-confirm"]').click()

            cy.get('td[class="text-left"]').contains(subscriberPhonebookEntry.name).should('be.visible')
            cy.get('td[class="text-left"]').contains(subscriberPhonebookEntry.number).should('be.visible')
        })

        it('Edit subscriber phonebook entry', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('div[class="q-gutter-x-sm"] button:first').click()
            cy.get('div[data-cy="csc-phonebook-entry-edit"]').click()

            cy.get('input[data-cy="csc-phonebook-details-number"]').clear().type('randomnumber')
            cy.get('button[data-cy="csc-phonebook-details-confirm"]').click()

            cy.get('td[class="text-left"]').contains(subscriberPhonebookEntry.name).should('be.visible')
            cy.get('td[class="text-left"]').contains('randomnumber').should('be.visible')
        })

        it('Try to call back contact', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('button[data-cy="csc-phonebook-entry-callback"]').click()

            cy.get('input[data-cy="csc-call-number-input"][value="' + subscriberPhonebookEntry.number + '"]').should('be.visible')
        })

        it('Share contact to other subscriber', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('div[role="switch"][data-cy="q-toggle"]').click()
            cy.get('div[role="switch"][data-cy="q-toggle"][aria-checked="true"]').should('be.visible')

            cy.get('button[data-cy="user-menu"]').click()
            cy.get('div[data-cy="user-logout"]').click()
            cy.locationShouldBe('#/login')

            cy.loginUiCSC(subscriberSharedPhonebook.webusername + "@" + subscriberSharedPhonebook.domain, subscriberSharedPhonebook.webpassword)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('td[class="text-left"]').contains(subscriberPhonebookEntry.name).should('be.visible')
            cy.get('td[class="text-left"]').contains(subscriberPhonebookEntry.number).should('be.visible')
            cy.get('div[role="switch"][data-cy="q-toggle"][aria-disabled="true"]').should('be.visible')
        })

        it('Search for all phonebook entries', function () {
            if (!issppro) {
                this.skip()
            }
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriberPhonebook({data: secondSubscriberPhonebookEntry, authHeader})
            })
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('button[data-cy="groups-filter-open"]').click()
            cy.qSelect({ dataCy: 'csc-phonebook-search-filter', itemContains: 'Name' })
            cy.get('input[data-cy="csc-phonebook-entry-search-input"]').type(subscriberPhonebookEntry.name)
            cy.get('i').contains('search').click()

            cy.get('td[class="text-left"]:last').contains(secondSubscriberPhonebookEntry.number).should('not.exist')
            cy.get('td[class="text-left"]:first').contains(subscriberPhonebookEntry.name).should('be.visible')
            cy.get('i[aria-label="Remove"]').click()
            cy.qSelect({ dataCy: 'csc-phonebook-search-filter', itemContains: 'Number' })
            cy.get('input[data-cy="csc-phonebook-entry-search-input"]').type(secondSubscriberPhonebookEntry.number)
            cy.get('i').contains('search').click()

            cy.get('td[class="text-left"]:first').contains(subscriberPhonebookEntry.name).should('not.exist')
            cy.get('td[class="text-left"]:first').contains(secondSubscriberPhonebookEntry.name).should('be.visible')
            cy.get('i[aria-label="Remove"]').click()
            cy.qSelect({ dataCy: 'csc-phonebook-search-filter', itemContains: 'Shared' })
            cy.qSelect({ dataCy: 'csc-phonebook-search-shared', itemContains: 'No' })

            cy.get('td[class="text-left"]:last').contains(secondSubscriberPhonebookEntry.number).should('not.exist')
            cy.get('td[class="text-left"]:first').contains(subscriberPhonebookEntry.name).should('be.visible')
            cy.get('i[aria-label="Remove"]').click()
            cy.qSelect({ dataCy: 'csc-phonebook-search-shared', itemContains: 'Yes' })

            cy.get('td[class="text-left"]:first').contains(subscriberPhonebookEntry.name).should('not.exist')
            cy.get('td[class="text-left"]:first').contains(secondSubscriberPhonebookEntry.name).should('be.visible')
        })

        it('Delete subscriber phonebook entry', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Subscriber Phonebook').click()
            cy.get('div[class="q-gutter-x-sm"] button:first').click()
            cy.get('div[data-cy="csc-phonebook-entry-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div').contains('No data available').should('be.visible')
        })
    })
})
