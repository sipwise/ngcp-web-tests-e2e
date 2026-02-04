/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateCustomer,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveSubscriberBy,
    waitPageProgressCSC,
    getRandomNum
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
let issppro = null

export const domain = {
    domain: 'domainFaxSettings',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberFaxSet',
    webusername: 'subscriberFaxSet',
    email: 'subscriberFaxSet@test.com',
    external_id: 'subscriberFaxSet',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 9990
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerFaxSet',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

context('Fax settings page tests', () => {
    context('UI fax settings tests', () => {
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
                apiCreateSubscriber({ data:  subscriber, authHeader })
                cy.intercept('GET', 'platforminfo').as('platforminfo')
                cy.visit('/')
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.type === 'sppro') {
                        issppro = true
                    } else {
                        cy.log('Skipping all tests, because this is not an SPPRO instance');
                        issppro = false
                        return
                    }
                })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
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
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Try to enable fax to mail', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()
            cy.get('div[data-cy="faxtomail-enable"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-enable"] input').click({ force: true })

            cy.get('button[data-cy="appsicon-more"]').should('be.visible')
        })

        it('Try to disable and enable T38 and ECM', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()

            cy.get('div[data-cy="faxtomail-t38"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-t38"] input').click({ force: true })
            cy.get('div[data-cy="faxtomail-t38"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-t38"][aria-checked="false"]').should('be.visible')

            cy.get('div[data-cy="faxtomail-ecm"] input').click({ force: true })
            cy.get('div[data-cy="faxtomail-ecm"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-ecm"][aria-checked="false"]').should('be.visible')

            cy.get('div[data-cy="faxtomail-t38"] input').click({ force: true })
            cy.get('div[data-cy="faxtomail-t38"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-t38"][aria-checked="true"]').should('be.visible')

            cy.get('div[data-cy="faxtomail-ecm"] input').click({ force: true })
            cy.get('div[data-cy="faxtomail-ecm"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="faxtomail-ecm"][aria-checked="true"]').should('be.visible')
        })

        it('Try to create a destination with invalid values', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('button[data-cy="destination-add"]').click()

            cy.get('input[data-cy="destination-email"]').type('invalidemail')
            cy.get('div[role="alert"]').contains('Input a valid email address').should('be.visible')
            cy.get('button[data-cy="destinaton-creation-confirm"][aria-disabled="true"]').should('be.visible')
            cy.get('button[data-cy="destinaton-cancel-creation"]').click()

            cy.get('input[data-cy="destination-email"]').should('not.exist')
            cy.get('button[data-cy="destinaton-creation-confirm"]').should('not.exist')
            cy.get('button[data-cy="destinaton-cancel-creation"]').should('not.exist')
        })

        it('Try to create a destination', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('button[data-cy="destination-add"]').click()

            cy.get('input[data-cy="destination-email"]').type('test@mail.com')
            cy.get('div[data-cy="destinaton-filetype"]').click()
            cy.get('div[role="listbox"]').contains('PS').click()
            cy.get('button[data-cy="destinaton-creation-confirm"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

            cy.get('div[class="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
        })

        it('Try to edit a destination', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('button[data-cy="destination-add"]').click()

            cy.get('input[data-cy="destination-email"]').type('test@mail.com')
            cy.get('div[data-cy="destinaton-filetype"]').click()
            cy.get('div[role="listbox"]').contains('PS').click()
            cy.get('button[data-cy="destinaton-creation-confirm"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

            cy.get('div[class="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
            cy.get('i[data-cy="destination-icon-deliver-incoming"]').contains('call_received').should('be.visible')
            cy.get('i[data-cy="destination-icon-deliver-outgoing"]').contains('call_made').should('be.visible')

            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('div[data-cy="destinaton-deliver-incoming"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('i[data-cy="destination-icon-deliver-incoming"]').should('have.value', '')
            cy.wait(1000)
            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('div[data-cy="destinaton-deliver-outgoing"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('i[data-cy="destination-icon-deliver-outgoing"]').should('have.value', '')
            cy.wait(1000)
            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('div[data-cy="destinaton-deliver-incoming"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.wait(1000)
            cy.get('div[data-cy="destinaton-deliver-outgoing"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('div[class="csc-list-item-title"]').click()
            cy.get('i[data-cy="destination-icon-deliver-incoming"]').contains('call_received').should('be.visible')
            cy.get('i[data-cy="destination-icon-deliver-outgoing"]').contains('call_made').should('be.visible')
        })

        it('Try to delete a destination', function () {
            if (!issppro) {
                this.skip()
            }
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/fax-settings"]').should('be.visible')
            cy.get('a[href="#/user/fax-settings"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
            cy.get('button[data-cy="destination-add"]').click()

            cy.get('input[data-cy="destination-email"]').type('test@mail.com')
            cy.get('div[data-cy="destinaton-filetype"]').click()
            cy.get('div[role="listbox"]').contains('PS').click()
            cy.get('button[data-cy="destinaton-creation-confirm"]').click()
            cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

            cy.get('div[class="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
            cy.get('div[class="csc-list-item-head-menu"]').click()
            cy.get('div[data-cy="destination-delete"]').click()

            cy.get('button[data-cy="csc-dialog-delete"]').click()
            waitPageProgressCSC()
            cy.get('div[class="csc-list-item-title"]').should('not.exist')
        })
    })
})
