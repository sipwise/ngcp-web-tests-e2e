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

const domain = {
    domain: 'domainSubscriberRoles',
    reseller_id: 1
}

const subscriber = {
    username: 'subscriberRoles',
    webusername: 'subscriberRoles',
    email: 'subscriberRoles@test.com',
    external_id: 'subscriberRoles',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 17,
        ac: 23,
        cc: 5555
    },
}

const admin_subscriber = {
    username: 'admin_subscriberRoles',
    webusername: 'admin_subscriberRoles',
    email: 'admin_subscriberRoles@test.com',
    external_id: 'admin_subscriberRoles',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 17,
        ac: 23,
        cc: 6666
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
        cc: 7777
    },
}

const pbx_subscriber = {
    username: 'pbxsubscriberRoles',
    webusername: 'pbxsubscriberRoles',
    email: 'pbxsubscriberRoles@test.com',
    external_id: 'pbxsubscriberRoles',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '01'
}

const pbx_admin_subscriber = {
    username: 'pbxadmin_subscriberRoles',
    webusername: 'pbxadmin_subscriberRoles',
    email: 'pbxadmin_subscriberRoles@test.com',
    external_id: 'pbxadmin_subscriberRoles',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '02'
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerSubscriberRoles',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerSubscriberRoles',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const ngcpConfig = Cypress.config('ngcpConfig')
let iscloudpbx = false

const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

context('Subscriber roles tests', () => {
    context('UI Subscriber roles tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: admin_subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pbx_admin_subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                cy.log('Data clean up pre-tests completed')
                apiCreateDomain({ data: domain, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                    admin_subscriber.customer_id = id
                })
                apiCreateSubscriber({ data: subscriber, authHeader })
                cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
                cy.visit('/')
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.wait('@platforminfo').then(({ response }) => {
                    if (response.body.cloudpbx) {
                        iscloudpbx = true
                    } else {
                        cy.log('Skipping pbx subscriber tests, because cloudpbx is not enabled on this instance');
                        iscloudpbx = false
                    }
                })
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                    pbx_subscriber_pilot.customer_id = id
                    pbx_subscriber.customer_id = id
                    pbx_admin_subscriber.customer_id = id
                })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: admin_subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
                apiRemoveSubscriberBy({ name: pbx_admin_subscriber.username, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        context('Test subscriber', () => {
            before(() => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiCreateSubscriber({ data: subscriber, authHeader })
                })
                loginInfo.username = `${subscriber.webusername}@${domain.domain}`
                loginInfo.password = `${subscriber.webpassword}`
            })

            beforeEach(() => {
                cy.visit('/')
            })

            after(() => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader })
                })
            })

            it('Login and check if subscriber cannot see pbx and admin pages, cannot see SIP password fields', () => {
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').should('not.exist')
                cy.get('input[data-cy="sip-password-field"]').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Statistics').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').should('not.exist')
            })

            it('Check if subscriber can create/delete an object (speed dial)', () => {
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
                cy.get('a[href="#/user/speeddial"]').click()

                cy.get('button[data-cy="csc-speeddial-add"]').click()
                cy.get('div[data-cy="csc-speeddial-slot"]').click()
                cy.get('div[aria-selected="false"]').contains('*1').click()
                cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
                cy.get('button[data-cy="csc-speeddial-save"]').click()

                cy.get('button[data-cy="csc-speeddial-more"]:first').click()
                cy.get('div[data-cy="csc-speeddial-remove"]').click()
                cy.get('button[data-autofocus="true"]').contains('OK').click()

                cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            })
        })

        context('Test admin subscriber', () => {
            before(() => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: admin_subscriber.external_id, authHeader })
                    loginInfo.username = `${admin_subscriber.webusername}@${domain.domain}`
                    loginInfo.password = `${admin_subscriber.webpassword}`
                })
            })

            beforeEach(() => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiCreateSubscriber({ data: admin_subscriber, authHeader })
                })
                cy.visit('/')
            })

            afterEach(() => {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemoveSubscriberBy({ name: admin_subscriber.external_id, authHeader })
                })
            })

            it('Login and check if admin subscriber cannot see pbx and admin pages, can see SIP password fields', () => {
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').should('be.visible')
                cy.get('input[data-cy="sip-password-field"]').should('be.visible')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Statistics').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').should('not.exist')
            })

            it('Change and copy SIP password', () => {
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.wrap(
                    Cypress.automation('remote:debugger:protocol', {
                        command: 'Browser.grantPermissions',
                        params: {
                        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
                        origin: window.location.origin,
                        },
                    }),
                );
                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').click()
                cy.get('div[data-cy="change-sip-password"]').find('input[aria-label="New SIP Password"]').type('testpassword')
                cy.get('div[data-cy="change-sip-password"]').find('input[aria-label="New SIP Password confirm"]').type('testpassword')
                cy.get('input[data-cy="sip-uri-field"]').click() //workaround for grey save button bug
                cy.get('span').contains('Save').click()
                cy.get('div[class="q-notification__message col"]').contains('Your SIP password has been changed successfully').should('exist')

                cy.get('button[data-cy="sip-password-field-copy"]').focus().click()
                cy.wait(500)
                cy.window().then((win) => {
                    win.navigator.clipboard.readText().then((text) => {
                    expect(text).to.eq('testpassword');
                    })
                })
            })

            it('Check if admin subscriber can create/delete an object (speed dial)', () => {
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
                cy.get('a[href="#/user/speeddial"]').click()

                cy.get('button[data-cy="csc-speeddial-add"]').click()
                cy.get('div[data-cy="csc-speeddial-slot"]').click()
                cy.get('div[aria-selected="false"]').contains('*1').click()
                cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
                cy.get('button[data-cy="csc-speeddial-save"]').click()

                cy.get('button[data-cy="csc-speeddial-more"]:first').click()
                cy.get('div[data-cy="csc-speeddial-remove"]').click()
                cy.get('button[data-autofocus="true"]').contains('OK').click()

                cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            })
        })

        context('Test pbx subscriber', () => {
            before(() => {
                if(iscloudpbx) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberBy({ name: pbx_subscriber.external_id, authHeader })
                        apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.external_id, authHeader })
                        apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
                        apiCreateSubscriber({ data: pbx_subscriber, authHeader })
                    })
                    loginInfo.username = `${pbx_subscriber.webusername}@${domain.domain}`
                    loginInfo.password = `${pbx_subscriber.webpassword}`
                }
            })

            beforeEach(() => {
                if(iscloudpbx) {
                    cy.visit('/')
                }
            })

            after(() => {
                if(iscloudpbx) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberBy({ name: pbx_subscriber.external_id, authHeader })
                        apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.external_id, authHeader })
                    })
                }

            })

            it('Login and check if pbx subscriber cannot see pbx, admin pages and SIP password fields, can see extension settings', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').should('not.exist')
                cy.get('input[data-cy="sip-password-field"]').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Statistics').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').should('not.exist')
                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').should('be.visible')
            })

            it('Check if pbx subscriber can create/delete an object (speed dial)', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
                cy.get('a[href="#/user/speeddial"]').click()

                cy.get('button[data-cy="csc-speeddial-add"]').click()
                cy.get('div[data-cy="csc-speeddial-slot"]').click()
                cy.get('div[aria-selected="false"]').contains('*1').click()
                cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
                cy.get('button[data-cy="csc-speeddial-save"]').click()

                cy.get('button[data-cy="csc-speeddial-more"]:first').click()
                cy.get('div[data-cy="csc-speeddial-remove"]').click()
                cy.get('button[data-autofocus="true"]').contains('OK').click()

                cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            })

            it('Check if pbx subscriber can edit a pbx subscriber setting (call queue)', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
                cy.get('a[href="#/user/extension-settings/call-queues"]').click()
                waitPageProgressCSC()

                cy.get('div[data-cy="csc-call-queue-feature-switch"]').click()

                cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-checked="true"]').should('be.visible')
            })
        })

        context('Test pbx admin subscriber', () => {
            before(() => {
                if(iscloudpbx){
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberBy({ name: pbx_admin_subscriber.external_id, authHeader })
                        apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.external_id, authHeader })
                        apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
                    })
                    loginInfo.username = `${pbx_admin_subscriber.webusername}@${domain.domain}`
                    loginInfo.password = `${pbx_admin_subscriber.webpassword}`
                }
            })

            beforeEach(() => {
                if(iscloudpbx) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiCreateSubscriber({ data: pbx_admin_subscriber, authHeader })
                    })
                    cy.visit('/')
                }
            })

            after(() => {
                if(iscloudpbx) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.external_id, authHeader })
                    })
                }
            })

            afterEach(() => {
                if(iscloudpbx) {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSubscriberBy({ name: pbx_admin_subscriber.external_id, authHeader })
                    })
                }
            })

            it('Login and check if pbx admin subscriber can see all pages', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').should('be.visible')
                cy.get('input[data-cy="sip-password-field"]').should('be.visible')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Statistics').should('be.visible')
                cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').should('be.visible')
                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').should('be.visible')
            })

            it('Change and copy SIP password', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.wrap(
                    Cypress.automation('remote:debugger:protocol', {
                        command: 'Browser.grantPermissions',
                        params: {
                        permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
                        origin: window.location.origin,
                        },
                    }),
                );
                cy.get('button[data-cy="user-menu"]').click()
                cy.get('a[data-cy="user-settings"]').click()

                cy.get('div[data-cy="change-sip-password"]').click()
                cy.get('div[data-cy="change-sip-password"]').find('input[aria-label="New SIP Password"]').type('testpassword')
                cy.get('div[data-cy="change-sip-password"]').find('input[aria-label="New SIP Password confirm"]').type('testpassword')
                cy.get('input[data-cy="sip-uri-field"]').click() //workaround for grey save button bug
                cy.get('span').contains('Save').click()
                cy.get('div[class="q-notification__message col"]').contains('Your SIP password has been changed successfully').should('exist')

                cy.get('button[data-cy="sip-password-field-copy"]').focus().click()
                cy.wait(500)
                cy.window().then((win) => {
                    win.navigator.clipboard.readText().then((text) => {
                    expect(text).to.eq('testpassword');
                    })
                })
            })

            it('Check if pbx admin subscriber can create/delete an object (speed dial)', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
                cy.get('a[href="#/user/speeddial"]').click()

                cy.get('button[data-cy="csc-speeddial-add"]').click()
                cy.get('div[data-cy="csc-speeddial-slot"]').click()
                cy.get('div[aria-selected="false"]').contains('*1').click()
                cy.get('input[data-cy="csc-speeddial-destination"]').type('testspeeddial')
                cy.get('button[data-cy="csc-speeddial-save"]').click()

                cy.get('button[data-cy="csc-speeddial-more"]:first').click()
                cy.get('div[data-cy="csc-speeddial-remove"]').click()
                cy.get('button[data-autofocus="true"]').contains('OK').click()

                cy.get('div[data-cy="csc-speeddial-whendial"]').should('not.exist')
            })

            it('Check if pbx subscriber can edit a pbx subscriber setting (call queue)', function () {
                if (!iscloudpbx) {
                    this.skip()
                }
                cy.loginUiCSC(loginInfo.username, loginInfo.password)
                cy.get('a[href="#/user/dashboard"]').should('be.visible')

                cy.get('div[data-cy="q-item-label"]').contains('Extension Settings').click()
                cy.get('a[href="#/user/extension-settings/call-queues"]').click()

                waitPageProgressCSC()
                cy.get('div[data-cy="csc-call-queue-feature-switch"]').click()

                cy.get('div[data-cy="csc-call-queue-feature-switch"][aria-checked="true"]').should('be.visible')
            })
        })
    })
})
