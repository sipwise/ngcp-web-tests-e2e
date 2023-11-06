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
    waitPageProgress
} from '../../support/ngcp-csc-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customer' + getRandomNum(),
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const domain = {
    domain: 'domain' + getRandomNum(),
    reseller_id: 1
}

const subscriber = {
    username: 'subscriber' + getRandomNum(),
    webusername: 'subscriber' + getRandomNum(),
    email: 'email' + getRandomNum() + '@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0
}

const loginInfo = {
    username: subscriber.webusername + '@' + subscriber.domain,
    password: subscriber.webpassword
}

context('Fax settings page tests', () => {
    context('UI fax settings tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriber({ data: subscriber, authHeader })
            })
            cy.visit('/')
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            })
        })

        it('Try to enable fax to mail', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.get('a[href="#/user/fax-settings"]').should('be.visible')
                    cy.get('a[href="#/user/fax-settings"]').click()
                    cy.get('div[data-cy="faxtomail-enable"][aria-disabled="true"]').should('not.exist')
                    cy.get('div[data-cy="faxtomail-enable"] input').click({ force: true })

                    cy.get('button[data-cy="appsicon-more"]').should('be.visible')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Try to disable and enable T38 and ECM', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
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
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Try to create a destination with invalid values', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
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
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Try to create a destination', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.get('a[href="#/user/fax-settings"]').should('be.visible')
                    cy.get('a[href="#/user/fax-settings"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('button[data-cy="destination-add"]').click()

                    cy.get('input[data-cy="destination-email"]').type('test@mail.com')
                    cy.get('div[data-cy="destinaton-filetype"]').click()
                    cy.get('div[role="listbox"]').contains('PS').click()
                    cy.get('button[data-cy="destinaton-creation-confirm"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

                    cy.get('div[data-cy="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Try to edit a destination', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.get('a[href="#/user/fax-settings"]').should('be.visible')
                    cy.get('a[href="#/user/fax-settings"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('button[data-cy="destination-add"]').click()

                    cy.get('input[data-cy="destination-email"]').type('test@mail.com')
                    cy.get('div[data-cy="destinaton-filetype"]').click()
                    cy.get('div[role="listbox"]').contains('PS').click()
                    cy.get('button[data-cy="destinaton-creation-confirm"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

                    cy.get('div[data-cy="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
                    cy.get('i[data-cy="destination-icon-deliver-incoming"]').contains('call_received').should('be.visible')
                    cy.get('i[data-cy="destination-icon-deliver-outgoing"]').contains('call_made').should('be.visible')

                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('div[data-cy="destinaton-deliver-incoming"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('i[data-cy="destination-icon-deliver-incoming"]').should('have.value', '')
                    cy.wait(1000)
                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('div[data-cy="destinaton-deliver-outgoing"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('i[data-cy="destination-icon-deliver-outgoing"]').should('have.value', '')
                    cy.wait(1000)
                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('div[data-cy="destinaton-deliver-incoming"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.wait(1000)
                    cy.get('div[data-cy="destinaton-deliver-outgoing"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('div[data-cy="csc-list-item-title"]').click()
                    cy.get('i[data-cy="destination-icon-deliver-incoming"]').contains('call_received').should('be.visible')
                    cy.get('i[data-cy="destination-icon-deliver-outgoing"]').contains('call_made').should('be.visible')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })

        it('Try to delete a destination', () => {
            cy.intercept('GET', '**/api/platforminfo?lang=en').as('platforminfo')
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.type === 'sppro') {
                    cy.get('a[href="#/user/fax-settings"]').should('be.visible')
                    cy.get('a[href="#/user/fax-settings"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')
                    cy.get('button[data-cy="destination-add"]').click()

                    cy.get('input[data-cy="destination-email"]').type('test@mail.com')
                    cy.get('div[data-cy="destinaton-filetype"]').click()
                    cy.get('div[role="listbox"]').contains('PS').click()
                    cy.get('button[data-cy="destinaton-creation-confirm"]').click()
                    cy.get('button[data-cy="destination-add"][disabled="disabled"]').should('not.exist')

                    cy.get('div[data-cy="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
                    cy.get('div[class="csc-list-item-head-menu"]').click()
                    cy.get('div[data-cy="destination-delete"]').click()

                    cy.get('button[data-cy="csc-dialog-delete"]').click()
                    waitPageProgress()
                    cy.get('div[data-cy="csc-list-item-title"]').should('not.exist')
                } else {
                    cy.log('Not a SPPRO instance, exiting test...')
                }
            })
        })
    })
})
