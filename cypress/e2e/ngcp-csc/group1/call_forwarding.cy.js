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
    apiGetCFMappingByID
} from '../../../support/e2e'

let iscloudpbx = false
const ngcpConfig = Cypress.config('ngcpConfig')

const domain = {
    domain: 'domainCallForwarding',
    reseller_id: 1
}

const subscriber = {
    username: 'subscriberCF',
    webusername: 'subscriberCF',
    email: 'subscriberCF@test.com',
    external_id: 'subscriberCF',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 13,
        ac: 13,
        cc: 1113
    },
}

const pbx_subscriber_pilot = {
    username: 'pbxSubscriberPilotCF',
    webusername: 'pbxSubscriberPilotCF',
    email: 'pbxSubscriberPilotCF@test.com',
    external_id: 'pbxSubscriberPilotCF',
    display_name: 'PBX Pilot',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 17,
        ac: 23,
        cc: 8888
    },
}

const pbx_seat = {
    username: 'pbxSeatCF',
    webusername: 'pbxSeatCF',
    email: 'pbxSeatCF@test.com',
    external_id: 'pbxSeatCF',
    display_name: 'PBX Seat',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '11'
}

const pbx_second_seat = {
    username: 'pbxSecondSeatCF',
    webusername: 'pbxSecondSeatCF',
    email: 'pbxSecondSeatCF@test.com',
    external_id: 'pbxSecondSeatCF',
    display_name: 'PBX Second Seat',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '12'
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCF',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerCF',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const pbxAdminCFData = {
    bnumberset_numberlist: 'testBnumberNumberSetCF',
    bnumberset_number: 'testBnumberNumberCF',
    sourceset_numberlist: 'testSourceNumberSetCF',
    sourceset_number: 'testSourceNumberCF'
}

const subscriberLoginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const pbxPilotLoginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

const pbxSeatLoginInfo = {
    username: `${pbx_seat.webusername}@${pbx_seat.domain}`,
    password: `${pbx_seat.webpassword}`
}

function createCallForwarding(type, destinationType, number = '0123456789', pbx = false) {
    if (pbx){
        cy.get('button[data-cy="csc-add-pbx-forwarding"]').click()
    } else {
        cy.get('button[data-cy="csc-add-forwarding"]').click()
    }
    cy.get(`[data-cy="q-tab-${type}"]`).click()
    cy.get('[data-cy="csc-cf-destination-type"]').closest('.q-select').click()
    cy.get('.q-menu').should('be.visible').within(() => {
        cy.contains('.q-item', destinationType).click()
    })
    if (destinationType === 'Number') {
        cy.get('[data-cy="csc-cf-destination-number"]').should('be.visible').type(number)
    }
    if (destinationType === 'Custom Announcement') {
        cy.get('[data-cy="csc-cf-custom-announcement"]').closest('.q-select').click()
        cy.get('.q-menu').filter(':visible').contains('.q-item', 'custom_announcement_0').click()
    }
    if (destinationType === 'Seat') {
        cy.get('[data-cy="csc-cf-seat-select"]').closest('.q-select').click()
        cy.get('.q-menu').filter(':visible').contains('.q-item', pbx_second_seat.display_name).click()
    }
    cy.intercept({ method: 'GET', pathname: '**/api/cfmappings/*' }).as('getCFMappingsPage')
    cy.get('[data-cy="csc-cf-save"]').click()
    cy.wait('@getCFMappingsPage')
}

context('Call Forwarding tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            apiRemoveSubscriberBy({ username: subscriber.username, authHeader })
            apiRemoveCustomerBy({ external_id: customer.external_id, authHeader })
            apiRemoveDomainBy({ domain: domain.domain, authHeader })
            cy.log('Finished data cleanup')
            apiCreateDomain({ data: domain, authHeader })
            apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                subscriber.customer_id = id
            })
            cy.request({
                method: 'GET',
                url: `${ngcpConfig.apiHost}/api/platforminfo`,
                ...authHeader
            }).then(({ body }) => {
                if (body.cloudpbx) {
                    iscloudpbx = true
                    apiRemoveSubscriberBy({ username: pbx_second_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_subscriber_pilot.username, authHeader })
                    apiRemoveCustomerBy({ external_id: pbxcustomer.external_id, authHeader })
                    apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                        pbx_subscriber_pilot.customer_id = id
                        pbx_seat.customer_id = id
                        pbx_second_seat.customer_id = id
                    })
                } else {
                    iscloudpbx = false
                    cy.log('Not a CloudPBX enabled instance, skipping PBX Seat and PBX Admin tests...')
                }
                cy.log('Finished data creation, start running tests...')
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Starting cleanup...' })
        apiLoginAsSuperuser().then(authHeader => {
            if (iscloudpbx) {
                apiRemoveSubscriberBy({ username: pbx_second_seat.username, authHeader })
                apiRemoveSubscriberBy({ username: pbx_seat.username, authHeader })
                apiRemoveSubscriberBy({ username: pbx_subscriber_pilot.username, authHeader })
                apiRemoveCustomerBy({ external_id: pbxcustomer.external_id, authHeader })
            }
            apiRemoveSubscriberBy({ username: subscriber.username, authHeader })
            apiRemoveCustomerBy({ external_id: customer.external_id, authHeader })
            apiRemoveDomainBy({ domain: domain.domain, authHeader })
            cy.log('Cleanup complete!')
        })
    })

    context('Call Forward page tests', () => {
        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ username: subscriber.username, authHeader })
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
        })

        it('Try to create a malformed Call Forward (Number/Custom Announcement)', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('[data-cy="q-tab-cfu"]').click()
            cy.get('[data-cy="csc-cf-destination-type"]').closest('.q-select').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Number').click()
            })
            cy.get('[data-cy="csc-cf-destination-number"]').should('be.visible')
            cy.get('[data-cy="csc-cf-save"]').should('be.disabled')

            cy.get('[data-cy="csc-cf-destination-type"]').closest('.q-select').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Custom Announcement').click()
            })

            cy.get('[data-cy="csc-cf-custom-announcement"]').closest('.q-select').should('be.visible')
            cy.get('[data-cy="csc-cf-save"]').should('be.disabled')
        })

        it('Add and delete available, not available and busy Call Forwarding', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            // Create CF Always
            createCallForwarding('cfu', 'Voicebox')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('Always').should('be.visible')

            // Create CF Not Available
            createCallForwarding('cfna', 'Conference')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If not available').should('be.visible')

            // Create CF busy
            createCallForwarding('cfb', 'Voicebox')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If busy').should('be.visible')

            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('Always').should('not.exist')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If not available').should('not.exist')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If busy').should('not.exist')
        })

        it('Add two numbers to forward to, move numbers around', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cfu', 'Number')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('Always').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Forwarded to').should('be.visible')
            cy.get('span[value="0123456789"]').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-number"]').click()
            cy.get('input[data-cy="csc-forwarding-number-input"]').type('testingnumber')
            cy.get('button[data-cy="q-btn"]').contains('OK').click()
            cy.get('i').contains('access_time').click()
            cy.get('input:visible').clear()
            cy.get('input:visible').type('30')
            cy.get('button').contains('Set').click()
            cy.get('input:visible').should('not.exist')
            cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').last().contains('testingnumber').should('be.visible')

            cy.get('span[data-cy="csc-cf-destination"]').first().click()
            cy.get('input:visible').should('be.enabled').focus().clear().type('9876543210')
            cy.get('button').contains('Set').click()
            cy.get('span[data-cy="csc-cf-destination"]').first().contains('9876543210').should('be.visible')

            cy.get('button[data-cy="q-btn"]').last().click()
            cy.get('div[data-cy="csc-cf-destination-move-down"]').click()
            cy.get('span[data-cy="csc-cf-destination"]').first().contains('testingnumber').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').last().contains('9876543210').should('be.visible')

        })

        it('Add "Forward to voicebox" and delete it', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cfu', 'Number')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('Always').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-voicebox"]').click()

            cy.get('i').contains('access_time').click()
            cy.get('input:visible').clear()
            cy.get('input:visible').type('30')
            cy.get('button').contains('Set').click()

            cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').last().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div[class="q-item__label"]').contains('30 seconds').should('not.exist')
        })

        it('Enable and Disable a Call Forward condition', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cfu', 'Voicebox')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('Always').should('be.visible')
            cy.get('div[data-cy="csc-forwarding-toggle"]').click()
            cy.get('div[data-cy="csc-forwarding-toggle"][aria-checked="true"]').should('be.visible')

            cy.get('div[data-cy="csc-forwarding-toggle"]').click()
            cy.get('div[data-cy="csc-forwarding-toggle"][aria-checked="false"]').should('be.visible')
        })

        it('Create a cft and update timeout', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cft', 'Custom Announcement')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('On no answer').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('After Ring Timeout').should('be.visible')
            createCallForwarding('cft', 'Voicebox')
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').should('be.visible')
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').click()
            cy.get('input[data-cy="csc-forwarding-ring-timeout-global-input"]').clear().type('20')
            cy.get('button[data-cy="q-btn"] span').contains("Set").click()
            cy.get('div[class="q-item__label"]').contains('20 seconds').should('be.visible')
            cy.get('div[class="q-item__label"]').contains('60 seconds').should('not.exist')
        })

        it('Make sure that forwards other than primary number dont get changed', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cfu', 'Number')
            createCallForwarding('cft', 'Number')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('On no answer').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('After Ring Timeout').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-voicebox"]').click()
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').should('be.visible')
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').click()
            cy.get('input[data-cy="csc-forwarding-ring-timeout-global-input"]').clear().type('20')
            cy.get('button[data-cy="q-btn"] span').contains("Set").click()
            cy.get('div[class="q-item__label"]').contains('20 seconds').should('be.visible')
            cy.get('div[class="q-item__label"]').contains('60 seconds').should('be.visible')
        })

        it('Hover over call forward time to check if popup appears', () => {
            cy.quickLoginCSC(subscriberLoginInfo.username, subscriberLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            createCallForwarding('cft', 'Voicebox')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('On no answer').should('be.visible')
            cy.get('span[style="white-space: nowrap;"]').contains("60 seconds").trigger('mouseenter').trigger('pointerenter')
            cy.get('div[role="tooltip"]').contains('This setting is synced with "After Ring Timeout", which can be edited above').should('exist')
        })
    })

    context('PBX Seat Call Forwarding tests', () => {
        beforeEach(() => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ username: pbx_second_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_subscriber_pilot.username, authHeader })
                    apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
                    apiCreateSubscriber({ data: pbx_seat, authHeader })
                    apiCreateSubscriber({ data: pbx_second_seat, authHeader })
                })
            }
        })

        it('Create a Seat Call Forwarding destination', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.quickLoginCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('[data-cy="q-tab-cfu"]').click()
            cy.get('[data-cy="csc-cf-destination-type"]').closest('.q-select').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Seat').click()
            })
            cy.get('[data-cy="csc-cf-seat-select"]').closest('.q-select').click()
            cy.get('input:visible').last().clear().type(pbx_seat.display_name)
            cy.contains('.q-item', pbx_seat.display_name).click()
            cy.get('[data-cy="csc-cf-save"]').click()

            cy.get('#csc-wrapper-call-forwarding').contains('Always').should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_seat.display_name).should('be.visible')
        })

        it('Modify the current Seat selection', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.quickLoginCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('[data-cy="q-tab-cfu"]').click()
            cy.get('[data-cy="csc-cf-destination-type"]').closest('.q-select').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Seat').click()
            })
            cy.get('.q-menu').should('not.exist')
            cy.get('[data-cy="csc-cf-seat-select"]').closest('.q-select').click()
            cy.get('.q-menu').should('be.visible')
            cy.contains('.q-item', pbx_seat.display_name).click()
            cy.get('[data-cy="csc-cf-save"]').click()

            cy.contains('#csc-wrapper-call-forwarding span', pbx_seat.display_name).click()
            cy.get('input:visible').last().click()
            cy.contains('.q-item', pbx_second_seat.display_name).click()
            cy.contains('button', 'Set').click()

            cy.get('#csc-wrapper-call-forwarding').contains('Always').should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_second_seat.display_name).should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_seat.display_name).should('not.exist')
        })
    })

    context('PBX Admin Call Forward tests', () => {
        beforeEach(() => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ username: pbx_second_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_seat.username, authHeader })
                    apiRemoveSubscriberBy({ username: pbx_subscriber_pilot.username, authHeader })
                    apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
                    apiCreateSubscriber({ data: pbx_seat, authHeader })
                    apiCreateSubscriber({ data: pbx_second_seat, authHeader }).then(({ id }) => {
                        pbx_second_seat.subscriber_id = id
                    })
                })
            }
        })

        it('Create CF, check if owner Subscriber ID is set properly', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.quickLoginCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
            cy.get('.q-drawer a[href="#/user/pbx-configuration/seats"]').click()

            cy.get('div[data-cy="q-item-label"]').contains(pbx_seat.display_name).click()
            cy.get('div[data-cy="q-tab-call-forwards"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="q-tab-call-forwards"]').click()

            createCallForwarding('cfu', 'Seat', '0123456789', true)
            apiLoginAsSuperuser().then(authHeader => {
                apiGetCFMappingByID({ id: pbx_second_seat.subscriber_id, authHeader }).then(({ cfid }) => {
                    if (cfid != pbx_second_seat.subscriber_id) {
                        throw new Error('Subscriber ID (' + cfid + ') for created CF does not match ID of Subscriber (' + pbx_second_seat.subscriber_id + ') it should belong to')
                    }
                })
            })
        })


        it('Create Call Forwarding for Subscriber "pbxSeat" with bnumber, source, destination and timeset, check if "pbxSeat" can edit all settings ', function () {
            if (!iscloudpbx) {
                this.skip()
            }

            cy.quickLoginCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
            cy.get('.q-drawer a[href="#/user/pbx-configuration/seats"]').click()

            cy.get('div[data-cy="q-item-label"]').contains(pbx_seat.display_name).click()
            cy.get('div[data-cy="q-tab-call-forwards"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="q-tab-call-forwards"]').click()

            createCallForwarding('cfu', 'Seat', '0123456789', true)
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').click()
            cy.get('div[data-cy="csc-condition-call-to"]').click()
            cy.get('input[data-cy="csc-cf-bnumberset-numberlist"]').type(pbxAdminCFData.bnumberset_numberlist)
            cy.get('input[data-cy="csc-cf-bnumberset-number"]').type(pbxAdminCFData.bnumberset_number)
            cy.get('button[data-cy="csc-cf-bnumberset-save"]').click()
            cy.get('div[role="menu"]').should('not.exist')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.bnumberset_numberlist).should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.bnumberset_numberlist).click()
            cy.get('button[data-cy="csc-cf-bnumberset-unassign"]').click()
            cy.get('div[role="menu"]').should('not.exist')

            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').click()
            cy.get('div[data-cy="csc-condtion-call-from"]').click()
            cy.get('input[data-cy="csc-cf-sourceset-numberlist"]').type(pbxAdminCFData.sourceset_numberlist)
            cy.get('input[data-cy="csc-cf-sourceset-number"]').type(pbxAdminCFData.sourceset_number)
            cy.get('button[data-cy="csc-cf-sourceset-save"]').click()
            cy.get('div[role="menu"]').should('not.exist')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.sourceset_numberlist).should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.sourceset_numberlist).click()
            cy.get('button[data-cy="csc-cf-sourceset-unassign"]').click()
            cy.get('div[role="menu"]').should('not.exist')

            cy.logoutUiCSC()
            cy.quickLoginCSC(pbxSeatLoginInfo.username, pbxSeatLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').click()
            cy.get('div[data-cy="csc-condition-call-to"]').click()
            cy.get('button[data-cy="csc-cf-bnumberset-select"]').click()
            cy.get('input[data-cy="csc-cf-bnumberset-select-numberlist"]').click()
            cy.get('div[role="listbox"]').contains(pbxAdminCFData.bnumberset_numberlist).click()
            cy.get('button[data-cy="csc-cf-bnumberset-select-save"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.bnumberset_numberlist).should('be.visible')

            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').click()
            cy.get('div[data-cy="csc-condtion-call-from"]').click()
            cy.get('button[data-cy="csc-cf-sourceset-select"]').click()
            cy.get('input[data-cy="csc-cf-sourceset-select-numberlist"]').click()
            cy.get('div[role="listbox"]').contains(pbxAdminCFData.sourceset_numberlist).click()
            cy.get('button[data-cy="csc-cf-sourceset-select-save"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains(pbxAdminCFData.sourceset_numberlist).should('be.visible')
        })
    })
})
