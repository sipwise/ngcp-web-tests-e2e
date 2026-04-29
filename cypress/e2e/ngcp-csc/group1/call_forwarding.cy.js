/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    getRandomNum
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
let issppro = null
let iscloudpbx = false

const domain = {
    domain: 'domainCallForwarding',
    reseller_id: 1
}

const subscriber = {
    username: 'subscriberCallForw',
    webusername: 'subscriberCallForw',
    email: 'subscriberCallForw@test.com',
    external_id: 'subscriberCallForw',
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
    username: 'pbxsubscriberpilotRoles',
    webusername: 'pbxsubscriberpilotRoles',
    email: 'pbxsubscriberpilotRoles@test.com',
    external_id: 'pbxsubscriberpilotRoles',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
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
    username: 'pbxSeatCallForw',
    webusername: 'pbxSeatCallForw',
    email: 'pbxSeatCallForw@test.com',
    external_id: 'pbxSeatCallForw',
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
    username: 'pbxSecondSeatCallForw',
    webusername: 'pbxSecondSeatCallForw',
    email: 'pbxSecondSeatCallForw@test.com',
    external_id: 'pbxSecondSeatCallForw',
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
    external_id: 'customerCallForw',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerCallForw',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const pbxPilotLoginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

function isPbxSeatInstance() {
    return issppro && iscloudpbx
}

function createCallForwarding(type, destinationType) {
    cy.get('button[data-cy="csc-add-forwarding"]').click()
    cy.get(`[data-cy="q-tab-${type}"]`).click()
    cy.get('[data-cy="csc-cf-destination-type"]').click()
    cy.get('.q-menu').should('be.visible').within(() => {
        cy.contains('.q-item', destinationType).click()
    })
    if (destinationType === 'Number') {
        cy.get('[data-cy="csc-cf-destination-number"]').should('be.visible').type('0123456789')
    }
    if (destinationType === 'Custom Announcement') {
        cy.get('[data-cy="csc-cf-custom-announcement"]').click()
        cy.get('.q-menu').filter(':visible').contains('.q-item', 'custom_announcement_0').click()
    }
    cy.get('[data-cy="csc-cf-save"]').click()
}

function removePbxSubscribers(authHeader) {
    apiRemoveSubscriberBy({ name: pbx_second_seat.username, authHeader })
    apiRemoveSubscriberBy({ name: pbx_seat.username, authHeader })
    return apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
}

function createPbxSubscribers(authHeader) {
    apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
    return apiCreateSubscriber({ data: pbx_seat, authHeader })
}

context('Call forwarding page tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            removePbxSubscribers(authHeader)
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader })
            apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                subscriber.customer_id = id
            })
            cy.request({
                method: 'GET',
                url: `${ngcpConfig.apiHost}/api/platforminfo`,
                ...authHeader
            }).then(({ body }) => {
                issppro = body.type === 'sppro'
                iscloudpbx = body.cloudpbx

                if (!isPbxSeatInstance()) {
                    cy.log('Skipping PBX seat tests, because this is not a Pro PBX instance')
                    return
                }

                apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                    pbx_subscriber_pilot.customer_id = id
                    pbx_seat.customer_id = id
                    pbx_second_seat.customer_id = id
                })
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader }).then(() => {
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
        })
        cy.visit('/')
    })

    after(() => {
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            removePbxSubscribers(authHeader)
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    it('Creating a malformed call forward (Number/Custom Announcement) should not be possible', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
        cy.get('a[href="#/user/call-forwarding"]').click()

        cy.get('button[data-cy="csc-add-forwarding"]').click()
        cy.get('[data-cy="q-tab-cfu"]').click()
        cy.get('[data-cy="csc-cf-destination-type"]').click()
        cy.get('.q-menu').should('be.visible').within(() => {
            cy.contains('.q-item', 'Number').click()
        })
        cy.get('[data-cy="csc-cf-destination-number"]').should('be.visible')
        cy.get('[data-cy="csc-cf-save"]').should('be.disabled')

        cy.get('[data-cy="csc-cf-destination-type"]').click()
        cy.get('.q-menu').should('be.visible').within(() => {
            cy.contains('.q-item', 'Custom Announcement').click()
        })

        cy.get('[data-cy="csc-cf-custom-announcement"]').should('be.visible')
        cy.get('[data-cy="csc-cf-save"]').should('be.disabled')
    })

    it('Add and delete available, not available and busy call forwarding', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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

    it('Add two numbers to forward to', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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

        cy.get('i').contains('access_time').click()
        cy.get('input:visible').clear()
        cy.get('input:visible').type('30')
        cy.get('button').contains('Set').click()

        cy.get('input:visible').should('not.exist')
        cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
        cy.get('span[data-cy="csc-cf-destination"]').last().click()
        cy.get('input:visible').should('be.enabled').focus().type('9876543210')
        cy.get('button').contains('Set').click()

        cy.get('span[value="9876543210"]').should('be.visible')
    })

    it('Add "Forward to voicebox" and delete it', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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

    it('Enable and Disable a call forward condition', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
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
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
        cy.get('a[href="#/user/call-forwarding"]').click()

        createCallForwarding('cft', 'Voicebox')
        cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
        cy.get('div[id="csc-wrapper-call-forwarding"]').contains('On no answer').should('be.visible')
        cy.get('span[style="white-space: nowrap;"]').contains("60 seconds").trigger('mouseenter')
        cy.get('div[role="tooltip"]').contains('This setting is synced with "After Ring Timeout", which can be edited above').should('exist')
    })
    context('PBX seat call forwarding tests', () => {
        beforeEach(() => {
            if (!isPbxSeatInstance()) {
                this.skip()
            }

            apiLoginAsSuperuser().then(authHeader => {
                removePbxSubscribers(authHeader)
                createPbxSubscribers(authHeader)
            })
        })

        it('Create a seat call forwarding destination', () => {
            cy.loginUiCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('[data-cy="q-tab-cfu"]').click()
            cy.get('[data-cy="csc-cf-destination-type"]').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Seat').click()
            })
            cy.get('[data-cy="csc-cf-seat-select"]').click()
            cy.get('input:visible').last().clear().type(pbx_seat.display_name)
            cy.contains('.q-item', pbx_seat.display_name).click()
            cy.get('[data-cy="csc-cf-save"]').click()

            cy.get('#csc-wrapper-call-forwarding').contains('Always').should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_seat.display_name).should('be.visible')
        })

        it('Modify the current seat selection', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriber({ data: pbx_second_seat, authHeader })
            })
            cy.loginUiCSC(pbxPilotLoginInfo.username, pbxPilotLoginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('[data-cy="q-tab-cfu"]').click()
            cy.get('[data-cy="csc-cf-destination-type"]').click()
            cy.get('.q-menu').should('be.visible').within(() => {
                cy.contains('.q-item', 'Seat').click()
            })
            cy.get('[data-cy="csc-cf-seat-select"]').click()
            cy.get('input:visible').last().clear().type(pbx_seat.display_name)
            cy.contains('.q-item', pbx_seat.display_name).click()
            cy.get('[data-cy="csc-cf-save"]').click()

            cy.contains('#csc-wrapper-call-forwarding span', pbx_seat.display_name).click()
            cy.get('input:visible').last().clear().type(pbx_second_seat.display_name)
            cy.contains('.q-item', pbx_second_seat.display_name).click()
            cy.contains('button', 'Set').click()

            cy.get('#csc-wrapper-call-forwarding').contains('Always').should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_second_seat.display_name).should('be.visible')
            cy.get('#csc-wrapper-call-forwarding').contains(pbx_seat.display_name).should('not.exist')
        })
    })
})
