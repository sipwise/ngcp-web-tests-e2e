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
let iscloudpbx = null
let issppro = null

const domain = {
    domain: 'domainFaxSettings',
    reseller_id: 1
}

const subscriber = {
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

const pbx_subscriber_pilot = {
    username: 'pbxsubpilotFaxsettings',
    webusername: 'pbxsubpilotFaxsettings',
    email: 'pbxsubpilotFaxsettings@test.com',
    external_id: 'pbxsubpilotFaxsettings',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 77,
        ac: 53,
        cc: 4234
    },
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerFaxSet',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerFaxsettings',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}

const pbxloginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

context('Fax settings page tests', () => {
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
            apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                    pbx_subscriber_pilot.customer_id = id
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
                if (response.body.cloudpbx === true) {
                    iscloudpbx = true
                } else {
                    cy.log('Skipping Mail2Fax tests, because CloudPBX is not enabled on this instance');
                    iscloudpbx = false
                    return
                }
            })
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
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

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/fax-settings"]').should('be.visible')
        cy.get('a[href="#/user/fax-settings"]').click()
        cy.get('div[data-cy="faxtomail-enable"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="faxtomail-enable"] input').click({ force: true })

        cy.get('button[data-cy="appsicon-more"]').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Try to disable and enable T38 and ECM', function () {
        if (!issppro) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
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

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Try to create a destination with invalid values', function () {
        if (!issppro) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
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

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Try to create a destination', function () {
        if (!issppro) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
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

        cy.get('div[data-cy="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Try to edit a destination', function () {
        if (!issppro) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
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

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Try to delete a destination', function () {
        if (!issppro) {
            this.skip()
        }

        // Setup: Create Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
            apiCreateSubscriber({ data:  subscriber, authHeader })
        })

        cy.visit('/')
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

        cy.get('div[data-cy="csc-list-item-title"]').contains('<test@mail.com> as PS').should('be.visible')
        cy.get('div[class="csc-list-item-head-menu"]').click()
        cy.get('div[data-cy="destination-delete"]').click()

        cy.get('button[data-cy="csc-dialog-delete"]').click()
        waitPageProgressCSC()
        cy.get('div[data-cy="csc-list-item-title"]').should('not.exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: subscriber.username, authHeader })
        })
    })

    it('Enable/Disable Mail2Fax', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create PBX Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader })
        })

        cy.visit('/')
        cy.loginUiCSC(pbxloginInfo.username, pbxloginInfo.password)
        cy.get('a[href="#/user/fax-settings"]').should('be.visible')
        cy.get('a[href="#/user/fax-settings"]').click()
        cy.get('div[class="q-tab__label"]').contains('Mail to Fax').click()

        cy.get('div[data-cy="csc-mailtofax-active"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-mailtofax-active"]').click()
        cy.get('div[data-cy="csc-mailtofax-active"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-mailtofax-active"][aria-checked="false"]').should('not.exist')
        cy.get('div[data-cy="csc-mailtofax-active"][aria-checked="true"]').should('be.visible')
        cy.get('div[data-cy="csc-mailtofax-active"]').click()
        cy.get('div[data-cy="csc-mailtofax-active"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-mailtofax-active"][aria-checked="true"]').should('not.exist')
        cy.get('div[data-cy="csc-mailtofax-active"][aria-checked="false"]').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Add Secret Key and change renew interval', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create PBX Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader })
        })

        cy.visit('/')
        cy.loginUiCSC(pbxloginInfo.username, pbxloginInfo.password)
        cy.get('a[href="#/user/fax-settings"]').should('be.visible')
        cy.get('a[href="#/user/fax-settings"]').click()
        cy.get('div[class="q-tab__label"]').contains('Mail to Fax').click()

        cy.get('input[data-cy="csc-mailtofax-secretkey"]').type('secretkey')
        cy.get('button[data-cy="q-btn-1"]').click()
        cy.get('input[data-cy="csc-mailtofax-secretkey"][value="secretkey"]').should('be.visible')
        cy.get('input[data-cy="csc-mailtofax-secretkey"]').type('add')
        cy.get('button[data-cy="q-btn"]').contains('Undo').click()
        cy.get('input[data-cy="csc-mailtofax-secretkey"][value="secretkey"]').should('be.visible')
        cy.qSelect({ dataCy: 'csc-mailtofax-secretkey-renew', itemContains: 'Monthly' })
        cy.get('input[aria-label="Secret Key Renew"][value="Monthly"]').should('exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Add/Remove Secret Key Notify E-mail', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create PBX Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader })
        })

        cy.visit('/')
        cy.loginUiCSC(pbxloginInfo.username, pbxloginInfo.password)
        cy.get('a[href="#/user/fax-settings"]').should('be.visible')
        cy.get('a[href="#/user/fax-settings"]').click()
        cy.get('div[class="q-tab__label"]').contains('Mail to Fax').click()

        cy.get('button[data-cy="csc-mailtofax-secretnotify-add"]').click()
        cy.get('input[data-cy="csc-mailtofax-secretkey-renew-email"]').type('test.mail@test.com')
        cy.get('button[data-cy="csc-mailtofax-secretkey-renew-createbutton"]').click()
        cy.get('div[class="q-item__label"]').contains('test.mail@test.com').should('be.visible')
        cy.get('div[class="q-item__label"]').contains('test.mail@test.com').click()
        cy.get('input[data-cy="csc-mailtofax-secretkey-renew-email"]').clear().type('anothertest.mail@test.com')
        cy.get('button[data-cy="q-btn-1"]').click()
        cy.get('div[class="q-item__label"]').contains('anothertest.mail@test.com').should('be.visible')
        cy.get('button[data-cy="csc-mailtofax-secretkey-renew-remove"]').click()
        cy.get('button[data-autofocus="true"]').click()
        cy.get('div[class="q-item__label"]').contains('anothertest.mail@test.com').should('not.exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Add/Remove ACL', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create PBX Subscriber, delete Subscriber if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data:  pbx_subscriber_pilot, authHeader })
        })

        cy.visit('/')
        cy.loginUiCSC(pbxloginInfo.username, pbxloginInfo.password)
        cy.get('a[href="#/user/fax-settings"]').should('be.visible')
        cy.get('a[href="#/user/fax-settings"]').click()
        cy.get('div[class="q-tab__label"]').contains('Mail to Fax').click()

        cy.get('button[data-cy="csc-mailtofax-acl-add"]').click()
        cy.get('input[data-cy="csc-mailtofax-acl-email"]').type('test.mail@test.com')
        cy.get('input[data-cy="csc-mailtofax-acl-ip"]').type('2.2.2.2')
        cy.get('input[data-cy="csc-mailtofax-acl-destination"]').type('dest')
        cy.get('button[data-cy="csc-mailtofax-acl-createbutton"]').click()
        cy.get('div[class="q-item__label text-caption"]').contains('test.mail@test.com').should('be.visible')
        cy.get('div[class="q-item__label text-caption"]').contains('test.mail@test.com').click()
        cy.get('input[data-cy="csc-mailtofax-acl-destination"]').clear().type('testest')
        cy.get('button[data-cy="q-btn-1"]').click()
        cy.get('div[class="q-item__label text-caption"]').contains('testest').should('be.visible')
        cy.get('button[title="Remove"]').click()
        cy.get('button[data-autofocus="true"]').click()
        cy.get('div[class="q-item__label"]').contains('test.mail@test.com').should('not.exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })
})
