/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiCreateSubscriberProfileSet,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    apiRemoveSubscriberProfileSetBy,
    apiCreateSubscriberProfile,
    apiRemoveSubscriberProfileBy,
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable
} from '../../../support/ngcp-aui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: `customerSubTests`,
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const customerPbx = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerPbxCypress1',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

export const domain = {
    reseller_id: 1,
    domain: 'domainSubscribersTests'
}

const pilotSubscriber = {
    username: 'subscriberPilotCypress',
    email: 'subscriberPilotCypress@test.com',
    external_id: 'subid11',
    password: 'sub!SUB' + getRandomNum() + '#pass$',
    is_pbx_pilot: true,
    primary_number: {
        sn: getRandomNum(),
        ac: getRandomNum(),
        cc: 7717
    },
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const seatSubscriber = {
    username: 'subscriberSeatCypress' ,
    email: 'subscriberSeatCypress@test.com',
    external_id: 'subid22',
    password: 'sub!SUB' + getRandomNum() + '#pass$',
    is_pbx_pilot: false,
    pbx_extension: 44,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const profileSet = {
    reseller_id: 1,
    description: 'testDescriptionProfileSetCypressSubscribers',
    descriptionNew: 'testDescriptionProfileSetCypressSubscribersNew',
    name: 'subscribersProfileSet'
}

export const subscriber = {
    username: 'subscriberTestsCypressAui',
    email: 'subscriberTestsCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: getRandomNum(4)
    },
}

const subscriberProfile = {
    name: 'profileSubscriberCypress',
    profile_set_id: 0,
    set_default: true,
    description: 'testDescriptionProfileSubscriberCypress'
}

context('Subscriber tests', () => {
    context('UI subscriber tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: seatSubscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pilotSubscriber.username, authHeader })
                apiRemoveSubscriberProfileBy({ name: subscriberProfile.name, authHeader })
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
                apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                })
                apiCreateCustomer({ data: customerPbx, authHeader }).then(({ id }) => {
                    pilotSubscriber.customer_id = id
                    seatSubscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: seatSubscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pilotSubscriber.username, authHeader })
                apiRemoveSubscriberProfileBy({ name: subscriberProfile.name, authHeader })
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
                
                apiCreateSubscriberProfileSet({ data: profileSet, authHeader }).then(({ id }) => {
                    apiCreateSubscriberProfile({ data: { ...subscriberProfile, profile_set_id: id }, authHeader })
                })
                apiCreateSubscriber({ data: subscriber, authHeader })
                apiCreateSubscriber({ data: pilotSubscriber, authHeader })
                apiCreateSubscriber({ data: seatSubscriber, authHeader })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: seatSubscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pilotSubscriber.username, authHeader })
                apiRemoveSubscriberProfileBy({ name: subscriberProfile.name, authHeader })
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
                apiRemoveCustomerBy({ name: customerPbx.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Check if subscriber with invalid values gets rejected', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSubscribers"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            waitPageProgress()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="aui-select-domain"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="subscriber-sip-username"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="subscriber-sip-password"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domain.domain, itemContains: domain.domain })
            cy.get('input[data-cy="subscriber-sip-username"]').type(subscriber.username)
            cy.get('input[data-cy="subscriber-sip-password"]').type('inva')
            cy.get('input[data-cy="subscriber-email"]').type('invalid')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('label[data-cy="subscriber-email"]').find('div[role="alert"]').contains('Input must be a valid email address').should('be.visible')
        })

        it('Create subscriber', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSubscribers"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            waitPageProgress()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-domain', filter: domain.domain, itemContains: domain.domain })
            cy.get('input[data-cy="subscriber-web-username"]').type(subscriber.username)
            cy.get('[data-cy="subscriber-password-generate"]:first').click()
            cy.get('input[data-cy="subscriber-sip-username"]').type(subscriber.username)
            cy.get('[data-cy="subscriber-password-generate"]:last').click()
            cy.get('input[data-cy="subscriber-email"]').type(subscriber.email)
            cy.get('input[data-cy="subscriber-external-id"]').type(subscriber.external_id)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit Subscriber Master Data', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / customer')

            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSubscribers"]').click()
            waitPageProgress()

            searchInDataTable(subscriber.external_id, 'Subscriber External ID')
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
            waitPageProgress()

            cy.get('a[data-cy="aui-edit-button"]').click()
            cy.get('input[data-cy="subscriber-email"]').clear()
            cy.get('input[data-cy="subscriber-email"]').type('newtest@mail.com')
            cy.get('input[data-cy="subscriber-web-username"]').clear()
            cy.get('input[data-cy="subscriber-web-username"]').type(seatSubscriber.external_id)
            cy.get('input[data-cy="subscriber-web-password"]').type(subscriber.password)
            cy.qSelect({ dataCy: 'aui-selection-lock-level', itemContains: 'Global' })
            cy.qSelect({ dataCy: 'subscriber-status', itemContains: 'Locked' })
            cy.get('label[data-cy="aui-selection-timezone"] input').type('Europe/Vienna')
            cy.get('div[role="listbox"]').should('be.visible')
            cy.wait(1000)
            cy.get('div[role="listbox"]').click()
            cy.get('label[data-cy="aui-select-profile-set"] input').type(profileSet.name)
            cy.get('div[role="listbox"]').should('be.visible')
            cy.wait(1000)
            cy.get('div[role="listbox"]').click()
            cy.get('label[data-cy="aui-select-profile"] input').click()
            cy.get('div[role="listbox"]').should('be.visible')
            cy.wait(1000)
            cy.get('div[role="listbox"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit Pilot Subscriber Master Data', () => {
            cy.intercept('GET', '**/api/platforminfo/').as('platforminfo')
            cy.reload()
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    searchInDataTable(customerPbx.external_id, 'External #')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSubscribers"]').click()
                    waitPageProgress()

                    searchInDataTable(pilotSubscriber.external_id, 'Subscriber External ID')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    waitPageProgress()

                    cy.get('a[data-cy="aui-edit-button"]').click()
                    cy.get('label[data-cy="aui-input-subscriber-username"] input').type(pilotSubscriber.external_id)
                    cy.get('input[data-cy="subscriber-email"]').clear()
                    cy.get('input[data-cy="subscriber-email"]').type('newtest@mail.com')
                    cy.get('input[data-cy="subscriber-web-username"]').clear()
                    cy.get('input[data-cy="subscriber-web-username"]').type(pilotSubscriber.external_id)
                    cy.get('input[data-cy="subscriber-web-password"]').type(pilotSubscriber.password)
                    cy.qSelect({ dataCy: 'aui-selection-lock-level', itemContains: 'Global' })
                    cy.qSelect({ dataCy: 'subscriber-status', itemContains: 'Locked' })
                    cy.get('label[data-cy="aui-selection-timezone"] input').type('Europe/Vienna')
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('label[data-cy="aui-select-profile-set"] input').type(profileSet.name)
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('label[data-cy="aui-select-profile"] input').click()
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Edit Seat Subscriber Master Data', () => {
            cy.intercept('GET', '**/api/platforminfo/').as('platforminfo')
            cy.reload()
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / customer')

                    cy.locationShouldBe('#/customer')
                    searchInDataTable(customerPbx.external_id, 'External #')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--customerDetailsSubscribers"]').click()
                    waitPageProgress()

                    searchInDataTable(seatSubscriber.external_id, 'Subscriber External ID')
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                    cy.get('a[data-cy="aui-data-table-row-menu--subscriberDetails"]').click()
                    waitPageProgress()

                    cy.get('a[data-cy="aui-edit-button"]').click()
                    cy.get('label[data-cy="aui-input-subscriber-username"] input').type(seatSubscriber.external_id)
                    cy.get('input[data-cy="subscriber-email"]').clear()
                    cy.get('input[data-cy="subscriber-email"]').type('newtest@mail.com')
                    cy.get('input[data-cy="subscriber-web-username"]').clear()
                    cy.get('input[data-cy="subscriber-web-username"]').type(seatSubscriber.external_id)
                    cy.get('input[data-cy="subscriber-web-password"]').type(seatSubscriber.password)
                    cy.qSelect({ dataCy: 'aui-selection-lock-level', itemContains: 'Global' })
                    cy.qSelect({ dataCy: 'subscriber-status', itemContains: 'Locked' })
                    cy.get('label[data-cy="aui-selection-timezone"] input').type('Europe/Vienna')
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('label[data-cy="aui-select-profile-set"] input').type(profileSet.name)
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('label[data-cy="aui-select-profile"] input').click()
                    cy.get('div[role="listbox"]').should('be.visible')
                    cy.wait(1000)
                    cy.get('div[role="listbox"]').click()
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Delete subscriber and check if they are deleted', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber')

            cy.locationShouldBe('#/subscriber')
            deleteItemOnListPageBy(subscriber.username)
        })
    })
})
