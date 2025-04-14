/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgress,
    getRandomNum
} from '../../../support/ngcp-csc/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

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
        sn: 11,
        ac: 22,
        cc: 2222
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCallForw',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}


context('Call forwarding page tests', () => {
    context('UI call forwarding tests', () => {
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

                apiCreateSubscriber({ 
                    data: {
                        ...subscriber,
                        primaryNumber: {
                            sn: 13,
                            ac: 13,
                            cc: 1113
                        }
                    },
                    authHeader
                 })
            cy.visit('/')
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Add and delete available, not available and busy call forwarding', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')

            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-not-available"]').click()

            waitPageProgress()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If not available').should('be.visible')
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-busy"]').click()

            waitPageProgress()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If busy').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('not.exist')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If not available').should('not.exist')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            waitPageProgress()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('If busy').should('not.exist')
        })

        it('Add two numbers to forward to', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')

            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').click()
            cy.get('input').type('0123456789')
            cy.get('button').contains('Set').click()

            waitPageProgress()
            cy.get('div[data-cy="q-item-label"]').contains('Forwarded to').should('be.visible')
            cy.get('span[value="0123456789"]').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-number"]').click()

            waitPageProgress()
            cy.get('i').contains('access_time').click()
            cy.get('input').clear()
            cy.get('input').type('30')
            cy.get('button').contains('Set').click()
            waitPageProgress()

            cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
            cy.get('span[data-cy="csc-cf-destination"]').last().click()
            cy.get('input').type('9876543210')
            cy.get('button').contains('Set').click()

            waitPageProgress()
            cy.get('span[value="9876543210"]').should('be.visible')
        })

        it('Add "Foward to voicebox" and delete it', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')

            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-voicebox"]').click()

            waitPageProgress()
            cy.get('i').contains('access_time').click()
            cy.get('input').clear()
            cy.get('input').type('30')
            cy.get('button').contains('Set').click()
            waitPageProgress()

            cy.get('div[class="q-item__label"]').contains('30 seconds').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').last().click()
            cy.get('div[data-cy="csc-forwarding-delete"]').click()
            cy.get('span[class="block"]').contains('OK').click()

            cy.get('div[class="q-item__label"]').contains('30 seconds').should('not.exist')
        })

        it('Disable and enable a call forward condition', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')

            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-disable"]').click()

            waitPageProgress()
            cy.get('div[data-cy="q-item-section"][class*="disabled"]').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-disable"]').click()

            waitPageProgress()
            cy.get('div[data-cy="q-item-section"][class*="disabled"]').should('not.exist')
        })

        it('Make global "After ring timeout" box appear and change value', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-ring-primary"]').click()
            waitPageProgress()
            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            waitPageProgress()
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').should('be.visible')
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').click()
            cy.get('input[data-cy="csc-forwarding-ring-timeout-global-input"]').clear().type('20')
            cy.get('button[data-cy="q-btn"] span').contains("Set").click()
            waitPageProgress()
            cy.get('div[class="q-item__label"]').contains('20 seconds').should('be.visible')
            cy.get('div[class="q-item__label"]').contains('60 seconds').should('not.exist')
        })

        it('Make sure that forwards other than primary number dont get changed', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-ring-primary"]').click()
            waitPageProgress()
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-to-voicebox"]').click()
            waitPageProgress()
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').should('be.visible')
            cy.get('span[data-cy="csc-forwarding-ring-timeout-global-edit"]').click()
            cy.get('input[data-cy="csc-forwarding-ring-timeout-global-input"]').clear().type('20')
            cy.get('button[data-cy="q-btn"] span').contains("Set").click()
            waitPageProgress()
            cy.get('div[class="q-item__label"]').contains('20 seconds').should('be.visible')
            cy.get('div[class="q-item__label"]').contains('60 seconds').should('be.visible')
        })

        it('Hover over call forward time to check if popup appears', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-forwarding"]').click()

            cy.get('button[data-cy="csc-add-forwarding"]').click()
            cy.get('div[data-cy="csc-add-forwarding-available"]').click()
            cy.get('div[id="csc-wrapper-call-forwarding"]').contains('condition').should('be.visible')
            cy.get('div[id="csc-wrapper-call-forwarding"] span').contains('If available').should('be.visible')
            cy.get('i[data-cy="q-icon"]').contains('more_vert').first().click()
            cy.get('div[data-cy="csc-forwarding-ring-primary"]').click()
            waitPageProgress()
            cy.get('span[style="white-space: nowrap;"]').contains("60 seconds").trigger('mouseenter')
            cy.get('div[role="tooltip"]').contains('This setting is synced with "After Ring Timeout", which can be edited above').should('exist')
        })
    })
})
