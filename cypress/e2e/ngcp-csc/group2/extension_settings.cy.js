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
    waitPageProgressCSC,
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
let iscloudpbx = false

const domain = {
    domain: 'domainExtensionSettings',
    reseller_id: 1
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerExtensionSettings',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const pbx_subscriber_pilot = {
    username: 'pbxsubscriberpilotExtension',
    webusername: 'pbxsubscriberpilotExtension',
    email: 'pbxsubscriberpilotExtension@test.com',
    external_id: 'pbxsubscriberpilotExtension',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    administrative: true,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 17,
        ac: 23,
        cc: 7777
    },
}

const pbx_subscriber = {
    username: 'pbxsubscriberExtension',
    webusername: 'pbxsubscriberExtension',
    email: 'pbxsubscriberExtension@test.com',
    external_id: 'pbxsubscriberExtension',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '01',
    primary_number: {
        sn: "17",
        ac: "23",
        cc: "7777"
    },
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerSubscriberExtension',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const subscriber = {
    username: 'subscriberExtensionSettings',
    webusername: 'subscriberExtensionSettings',
    email: 'subscriberExtensionSettings@test.com',
    external_id: 'subscriberExtensionSettings',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 1234,
        ac: 3456,
        cc: 9912
    },
}

const loginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${domain.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

const apiLoginInfo = {
    username: `${subscriber.webusername}@${domain.domain}`,
    password: `${subscriber.webpassword}`
}

context('Extension Settings tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader })
            apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                apiCreateSubscriber({ data: {...subscriber, customer_id: id}, authHeader })
            })
            cy.intercept('GET', 'platforminfo').as('platforminfo')
            cy.visit('/')
            cy.loginUiCSC(apiLoginInfo.username, apiLoginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.cloudpbx) {
                    iscloudpbx = true
                    apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                        apiCreateSubscriber({ data: { ...pbx_subscriber_pilot, customer_id: id }, authHeader })
                        pbx_subscriber.customer_id = id
                        pbx_subscriber_pilot.customer_id = id
                    })
                } else {
                    cy.log('Skipping all tests, because this is not an SPPRO instance');
                    iscloudpbx = false
                }
            })
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
        })
    })

beforeEach(() => {
        if (iscloudpbx) {
            return cy.wrap(apiLoginAsSuperuser()).then(authHeader => {
                apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
                apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
                cy.visit('/')
            })
        }
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    context('Call Queues', () => {
        it('Enable / Disable Call Queue', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/call-queues"]').click()

            cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-checked="false"]').should('be.visible')
            cy.get('div[data-cy="csc-call-queue-feature-switch"]').click()
            cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="csc-call-queue-feature-switch"]').click()
            cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-checked="false"]').should('be.visible')
        })

        it('Enter invalid Queue Length and Wrap Up time, undo changes', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/call-queues"]').click()

            cy.get('input[data-cy="csc-call-queue-length"]').clear().type('invalidtest')
            cy.get('input[data-cy="csc-call-queue-wrapup-time"]').clear().type('invalidtest')
            cy.get('input[data-cy="csc-call-queue-length"]').parents('label').find('div[role="alert"]').contains('Queue Length must consist of numeric characters only').should('be.visible')
            cy.get('input[data-cy="csc-call-queue-wrapup-time"]').parents('label').find('div[role="alert"]').contains('Wrap up time must consist of numeric characters only').should('be.visible')
            cy.get('span[class="block"]:last').contains('Undo').click()
            cy.get('span[class="block"]').contains('Undo').click()
            cy.get('input[data-cy="csc-call-queue-length"][value="5"]').should('be.visible')
            cy.get('input[data-cy="csc-call-queue-wrapup-time"][value="10"]').should('be.visible')
        })


        it('Save new values to Queue Length and Wrap Up time', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/call-queues"]').click()

            cy.get('input[data-cy="csc-call-queue-length"]').clear().type('30')
            cy.get('span[class="block"]').contains('Save').click()
            cy.get('input[data-cy="csc-call-queue-wrapup-time"]').clear().type('60')
            cy.get('span[class="block"]').contains('Save').click()
            cy.get('input[data-cy="csc-call-queue-length"][value="30"]').should('be.visible')
            cy.get('input[data-cy="csc-call-queue-wrapup-time"][value="60"]').should('be.visible')
        })
    })

    context('Manager Secretary Feature', () => {
        it('Enable / Disable Manager Secretary Feature', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/ms-configs"]').click()

            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="csc-manager-secretary-toggle"]').click()
            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="csc-manager-secretary-toggle"]').click()
            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-checked="false"]').should('be.visible')
        })

        it('Add Secretary Number', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            apiLoginAsSuperuser().then(authHeader => {
                // Setup: Create second PBX Subscriber, delete if already exists 
                apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
                apiCreateSubscriber({ data: pbx_subscriber, authHeader })
            })

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/ms-configs"]').click()

            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="csc-manager-secretary-toggle"]').click()
            cy.get('div[data-cy="csc-manager-secretary-toggle"][aria-checked="true"]').should('be.visible')
            waitPageProgressCSC()

            cy.qSelect({ dataCy: 'csc-manager-secretary-dropdown', itemContains: pbx_subscriber.primary_number.cc + pbx_subscriber.primary_number.ac + pbx_subscriber.primary_number.sn + pbx_subscriber.pbx_extension })
            cy.get('span[class="block"]').contains('Save').click()
            cy.get('input[aria-label="Select secretary numbers"][value="' + pbx_subscriber.primary_number.cc + pbx_subscriber.primary_number.ac + pbx_subscriber.primary_number.sn + pbx_subscriber.pbx_extension + '"]').should('exist')

            // Cleanup
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            })
        })
    })

    context('Auto Attendant', () => {
        it('Add one slot , add destinaton and remove it', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()
waitPageProgressCSC()
            cy.get('button[data-cy="csc-pbx-auto-attendant-add-slot"]').click()
            cy.get('div[role="list"][data-cy="q-list-0"]').click()
            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 0').should('be.visible')
            cy.get('input[aria-label="Destination"]').type('testdest', { force: true })
            cy.get('span[class="block"]').contains('Save').click()

            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 0').should('be.visible')
            cy.get('div[class="csc-list-item-subtitle"]').contains('sip:testdest@' + domain.domain)
        })

        it('Add two slots, add destinations and remove them', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
            cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()
waitPageProgressCSC()
            cy.get('button[data-cy="csc-pbx-auto-attendant-add-slot"]').click()
            cy.get('div[role="list"][data-cy="q-list-0"]').click()
            cy.get('div[role="list"][data-cy="q-list-1"]').click()
            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 0').should('be.visible')
            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 1').should('be.visible')
            cy.get('input[aria-label="Destination"]:first').type('testdest', { force: true })
            cy.get('input[aria-label="Destination"]:last').type('testdest2', { force: true })
            cy.get('span[class="block"]').contains('Save').click({ force: true })

            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 0').should('be.visible')
            cy.get('div[data-cy="csc-list-item-title"]').contains('Slot: 1').should('be.visible')
            cy.get('div[class="csc-list-item-subtitle"]').contains('sip:testdest@' + domain.domain)
            cy.get('div[class="csc-list-item-subtitle"]').contains('sip:testdest2@' + domain.domain)
        })
    })
})
