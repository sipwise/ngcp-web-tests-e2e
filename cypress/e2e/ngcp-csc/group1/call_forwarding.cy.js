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

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCF',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const subscriberLoginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

function createCallForwarding(type, destinationType, number = '0123456789') {
    cy.get('button[data-cy="csc-add-forwarding"]').click()
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
    cy.intercept({ method: 'GET', pathname: '**/api/cfdestinationsets/**' }).as('getCFDestinationSets')
    cy.get('[data-cy="csc-cf-save"]').click()
    cy.wait('@getCFDestinationSets')
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
            cy.log('Finished data creation, start running tests...')
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Starting cleanup...' })
        apiLoginAsSuperuser().then(authHeader => {
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
            cy.get('span[data-cy="csc-cf-destination"]:last').click()
            cy.get('input:visible').should('be.enabled').focus().clear().type('testingnumber')
            cy.intercept({ method: 'GET', pathname: '**/api/cfdestinationsets/**', times: 1 }).as('getCFDestinationSets')
            cy.get('button[data-cy="q-btn"]').contains('Set').click()
            cy.wait('@getCFDestinationSets')

            cy.get('i').contains('access_time').click()
            cy.get('input:visible').clear()
            cy.get('input:visible').type('30')
            cy.intercept({ method: 'GET', pathname: '**/api/cfdestinationsets/**', times: 1 }).as('getCFDestinationSets')
            cy.get('button').contains('Set').click()
            cy.wait('@getCFDestinationSets')

            cy.get('input:visible').should('not.exist')
            cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').last().contains('testingnumber').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').first().click()
            cy.get('input:visible').should('be.enabled').focus().clear().type('9876543210')
            cy.intercept({ method: 'GET', pathname: '**/api/cfdestinationsets/**', times: 1 }).as('getCFDestinationSets')
            cy.get('button').contains('Set').click()
            cy.wait('@getCFDestinationSets')
            cy.get('span[data-cy="csc-cf-destination"]').first().contains('9876543210').should('be.visible')

            cy.get('button[data-cy="q-btn"]').last().click()
            cy.intercept({ method: 'GET', pathname: '**/api/cfdestinationsets/**', times: 1 }).as('getCFDestinationSets')
            cy.get('div[data-cy="csc-cf-destination-move-up"]').click()
            cy.wait('@getCFDestinationSets')
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
})