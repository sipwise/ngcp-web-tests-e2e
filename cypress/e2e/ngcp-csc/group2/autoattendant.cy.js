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
    apiEditAutoAttendant,
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
let iscloudpbx = false

const domain = {
    domain: 'domainAutoAttendant',
    reseller_id: 1
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerAutoAttendant',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const pbx_subscriber_pilot = {
    username: 'pbxsubpilotAutoAttendant',
    webusername: 'pbxsubpilotAutoAttendant',
    email: 'pbxsubpilotAutoAttendant@test.com',
    external_id: 'pbxsubpilotAutoAttendant',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 73,
        ac: 52,
        cc: 8358
    },
}

const loginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

const autoattendant = {
    slots: [
        {
            slot:"0",
            destination:"SubscriberAutoAttendant"
        },
        {
            slot:"1",
            destination:"SecondSubscriberAutoAttendant"
        }
    ]
}

const autoattendantDelete = {
    slots: [
        {
            slot:"0",
            destination:"SubscriberAutoAttendantDelete"
        }
    ]
}

context('Auto Attendant tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader })
            cy.request({
                method: 'GET',
                url: `${ngcpConfig.apiHost}/api/platforminfo`,
                ...authHeader
            }).then(({ body }) => {
                if (body.cloudpbx) {
                    iscloudpbx = true
                    apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                        pbx_subscriber_pilot.customer_id = id
                    })
                } else {
                    cy.log('Not a CloudPBX enabled instance, skipping "Mail2Fax" tests...');
                    iscloudpbx = false
                    return
                }
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    it('Create multiple Auto Attendants', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader })
        })
        
        cy.visit('/')
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
        cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()
        
        cy.get('button[data-cy="csc-pbx-auto-attendant-add-slot"]').should('be.visible')
        cy.get('button[data-cy="csc-pbx-auto-attendant-add-slot"]').click()
        cy.wait(500)
        cy.get('div[data-cy="q-list-0"]').click()
        cy.get('div[data-cy="q-list-1"]').click()
        cy.get('div[id="csc-default-logo"]').click()
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]:first').type(autoattendant.slots[0].destination)
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]:last').type(autoattendant.slots[1].destination)

        cy.get('button[data-cy="csc-pbx-auto-attendant-input-save"]:last').click()
        cy.get('div[role="alert"]').contains('Slots saved successfully').should('be.visible')

        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:' + autoattendant.slots[0].destination).should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:' + autoattendant.slots[1].destination).should('be.visible')
    })

    it('Edit and reset Auto Attendants', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscriber and auto attendant
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader }).then(({ id }) => {
                apiEditAutoAttendant({ subid: id, data: autoattendant, authHeader})
            })
        })

        cy.visit('/')
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
        cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()

        cy.get('div[class="csc-list-item transition-generic"]:first').click()
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]').clear().type('testdestination')
        cy.get('button[data-cy="csc-pbx-auto-attendant-input-reset"]').click()
        cy.get('div[class="csc-list-item-title"]').contains('Slot: 0').click()

        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:' + autoattendant.slots[0].destination).should('be.visible')
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]').should('not.exist')

        cy.get('div[class="csc-list-item transition-generic"]:last').click()
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]').clear().type('anothertestdestination')
        cy.get('button[data-cy="csc-pbx-auto-attendant-input-reset"]').click()
        cy.get('div[class="csc-list-item-title"]').contains('Slot: 1').click()

        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:' + autoattendant.slots[1].destination).should('be.visible')
    })

    it('Edit and save Auto Attendants', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscriber and auto attendant
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader }).then(({ id }) => {
                apiEditAutoAttendant({ subid: id, data: autoattendant, authHeader})
            })
        })

        cy.visit('/')
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
        cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()

        cy.get('div[class="csc-list-item transition-generic"]:first').click()
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]').clear().type('testdestination')
        cy.get('button[data-cy="csc-pbx-auto-attendant-input-save"]').click()

        cy.get('div[role="alert"]').contains('Slots saved successfully').should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:testdestination').should('be.visible')

        cy.get('div[class="csc-list-item transition-generic"]:last').click()
        cy.get('input[data-cy="csc-pbx-auto-attendant-destination"]').clear().type('anothertestdestination')
        cy.get('button[data-cy="csc-pbx-auto-attendant-input-save"]').click()

        cy.get('div[role="alert"]').contains('Slots saved successfully').should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').contains('sip:anothertestdestination').should('be.visible')
    })

    it('Delete Auto Attendants', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscriber and auto attendant
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader }).then(({ id }) => {
                apiEditAutoAttendant({ subid: id, data: autoattendantDelete, authHeader})
            })
        })

        cy.visit('/')
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
        cy.get('a[href="#/user/extension-settings/auto-attendant"]').click()

        cy.get('div[class="csc-list-item-head-menu"]').click()
        cy.get('div[data-cy="csc-pbx-auto-attendant-delete"]').click()
        cy.get('button[data-cy="csc-dialog-delete"]').click()

        cy.get('div[role="alert"]').contains('Slots saved successfully').should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').should('not.exist')
    })
})
