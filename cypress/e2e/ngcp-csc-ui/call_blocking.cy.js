/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgress,
    apiCreateSubscriber,
    getRandomNum,
} from '../../support/ngcp-csc-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

export const domain = {
    domain: 'domainCallBlocking',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberCallBlocking',
    webusername: 'subscriberCallBlocking',
    email: 'subscriberCallBlocking@test.com',
    external_id: 'subscriberCallBlocking',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 1111
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCallBlocking',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}


context('Call blocking page tests', () => {
    context('UI call blocking tests', () => {
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
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader }).then(()=> {
                    apiCreateSubscriber({
                        data: {
                            ...subscriber,
                            primaryNumber: {
                                sn: 12,
                                ac: 12,
                                cc: 1112
                            }
                        },
                        authHeader
                     })
            })
            cy.visit('/')
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Enable incoming call block', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/incoming"]').click()

            waitPageProgress()
            cy.get('div[data-cy="csc-enable-incoming"]').click()
            cy.get('div[data-cy="csc-enable-incoming"][aria-checked="true"]').should('be.visible')

            cy.get('div[data-cy="csc-block-listed"]').click()
            cy.get('div[data-cy="csc-block-listed"][aria-checked="true"]').should('be.visible')

            cy.get('div[data-cy="csc-block-all"]').click()
            cy.get('div[data-cy="csc-block-all"][aria-checked="true"]').should('be.visible')

            cy.get('div[data-cy="csc-enable-incoming"]').click()
            cy.get('div[data-cy="csc-enable-incoming"][aria-checked="false"]').should('be.visible')
        })

        it('Add blocked number and enable blocklist for incoming calls', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/incoming"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('i[role="presentation"]').contains('block').should('be.visible')

            cy.get('div[data-cy="csc-block-listed"]').click()
            cy.get('div[data-cy="csc-block-listed"][aria-checked="true"]').should('be.visible')
            cy.get('i[role="presentation"]').contains('check').should('be.visible')

            cy.get('div[data-cy="csc-block-all"]').click()
            cy.get('div[data-cy="csc-block-all"][aria-checked="true"]').should('be.visible')
            cy.get('i[role="presentation"]').contains('block').should('be.visible')
        })

        it('Add/Edit/Delete blocked numbers for incoming calls', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/incoming"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('button[data-cy="csc-blocked-number-menu"]').click()
            cy.get('div[data-cy="csc-blocked-number-edit"]').click()
            cy.get('input[type="text"]').clear()
            cy.get('input[type="text"]').type('anothertest')
            cy.get('button').contains('Undo').click()

            cy.get('input[type="text"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('testnumber'))
            cy.get('button[data-cy="csc-blocked-number-menu"]').click()
            cy.get('div[data-cy="csc-blocked-number-edit"]').click()
            cy.get('input[type="text"]').clear()
            cy.get('input[type="text"]').type('anothertest')
            cy.get('button').contains('Save').click()

            cy.contains('anothertest').should('be.visible')
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('button[data-cy="csc-blocked-number-menu"]:first').click()
            cy.get('div[data-cy="csc-blocked-number-delete"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.contains('testnumber').should('not.exist')

            cy.get('button[data-cy="csc-blocked-number-menu"]:first').click()
            cy.get('div[data-cy="csc-blocked-number-delete"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.contains('anothertest').should('not.exist')
        })

        it('Add blocked number and enable blocklist for outgoing calls', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/outgoing"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('i[role="presentation"]').contains('block').should('be.visible')

            cy.get('div[data-cy="csc-block-listed"]').click()
            cy.get('div[data-cy="csc-block-listed"][aria-checked="true"]').should('be.visible')
            cy.get('i[role="presentation"]').contains('check').should('be.visible')

            cy.get('div[data-cy="csc-block-all"]').click()
            cy.get('div[data-cy="csc-block-all"][aria-checked="true"]').should('be.visible')
            cy.get('i[role="presentation"]').contains('block').should('be.visible')
        })

        it('Add/Edit/Delete blocked numbers for outgoing calls', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/call-blocking/outgoing"]').click()

            waitPageProgress()
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('button[data-cy="csc-blocked-number-menu"]').click()
            cy.get('div[data-cy="csc-blocked-number-edit"]').click()
            cy.get('input[type="text"]').clear()
            cy.get('input[type="text"]').type('anothertest')
            cy.get('button').contains('Undo').click()

            cy.get('input[type="text"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('testnumber'))
            cy.get('button[data-cy="csc-blocked-number-menu"]').click()
            cy.get('div[data-cy="csc-blocked-number-edit"]').click()
            cy.get('input[type="text"]').clear()
            cy.get('input[type="text"]').type('anothertest')
            cy.get('button').contains('Save').click()

            cy.contains('anothertest').should('be.visible')
            cy.get('button[data-cy="csc-add-number"]').click()
            cy.get('input[data-cy="csc-block-number-input"]').type('testnumber')
            cy.get('button[data-cy="csc-block-number-save"]').click()

            cy.contains('testnumber').should('be.visible')
            cy.get('button[data-cy="csc-blocked-number-menu"]:first').click()
            cy.get('div[data-cy="csc-blocked-number-delete"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.contains('testnumber').should('not.exist')

            cy.get('button[data-cy="csc-blocked-number-menu"]:first').click()
            cy.get('div[data-cy="csc-blocked-number-delete"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.contains('anothertest').should('not.exist')
        })
    })
})
