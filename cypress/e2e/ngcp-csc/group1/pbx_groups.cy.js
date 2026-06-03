/// <reference types="cypress" />

import {
    apiCreateCustomer,
    apiLoginAsSuperuser,
    getRandomNum,
    apiCreateDomain,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiCreateSubscriber,
    apiRemoveSubscriberBy,
    waitPageProgressCSC,
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
var iscloudpbx = null

const domain = {
    domain: 'domainDashboard',
    reseller_id: 1
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerSubGroups',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const pbxGroup = {
    display_name: 'pbxSubGroupTestsCypress',
    domain_id: 0,
    is_pbx_group: true,
    password: 'sub!SUB' + getRandomNum() + '#pass$',
    pbx_extension: "05",
    pbx_hunt_cancel_mode: "cancel",
    pbx_hunt_policy: "serial",
    pbx_hunt_timeout: 10,
    username: 'pbxSubGroupTestsCypress'
}

const pbx_subscriber_pilot = {
    username: 'pbxsubpilotSubGroups',
    webusername: 'pbxsubpilotSubGroups',
    email: 'pbxsubpilotSubGroups@test.com',
    external_id: 'pbxsubpilotSubGroups',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    administrative: true,
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 73,
        ac: 34,
        cc: 7395
    },
}

const pbx_subscriber = {
    username: 'pbxsubscriberSubGroups',
    webusername: 'pbxsubscriberSubGroups',
    email: 'pbxsubscriberSubGroups@test.com',
    external_id: 'pbxsubscriberSubGroups',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '01'
}

const pbx_admin_subscriber = {
    username: 'pbxadmin_subGroups',
    webusername: 'pbxadmin_subGroups',
    email: 'pbxadmin_subGroups@test.com',
    external_id: 'pbxadmin_subGroups',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: false,
    pbx_extension: '02'
}

const loginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

function createCallForwarding(type, destinationType) {
    cy.get('button[data-cy="csc-add-pbx-forwarding"]').click()
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

context('PBX Groups Tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_admin_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader }).then(({ id }) => {
                pbxGroup.domain_id = id
            })
            apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                pbx_subscriber.customer_id = id
                pbx_admin_subscriber.customer_id = id
                pbx_subscriber_pilot.customer_id = id
                pbxGroup.customer_id = id
            })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
            cy.visit('/')
            cy.loginUiCSC(loginInfo.username, loginInfo.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.cloudpbx === true) {
                    iscloudpbx = true
                } else {
                    cy.log('Skipping all tests, because CloudPBX is not enabled on this instance');
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
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_admin_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    it('Try to create an empty PBX Group', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscriber Pilot, delete Subscriber Pilot if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('button[data-cy="groups-add-new"]').click()
        cy.get('button[data-cy="group-btn-save"][aria-disabled="true"]').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Create a PBX Group', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers, delete Subscribers and Group if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('button[data-cy="groups-add-new"]').click()
        cy.get('input[data-cy="group-name"]').type(pbxGroup.username)
        cy.get('input[data-cy="group-extension"]').type(pbxGroup.pbx_extension)
        cy.qSelect({ dataCy: 'group-seats', itemContains: pbx_subscriber.username })
        cy.get('button[data-cy="group-btn-save"]').click()

        cy.get('div[class="csc-list-item-title"]').contains(pbxGroup.username).should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]:first').contains(pbxGroup.pbx_extension).should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]:last').contains(pbx_subscriber.username).should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Preferences Tab: Change toggle settings in PBX Group Details page', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()

        cy.get('div[data-cy="csc-group-announcement-cfucfna"]').click()
        cy.get('div[data-cy="csc-group-announcement-cfucfna"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-group-announcement-cfucfna"][aria-checked="true"]').should('exist')

        cy.get('div[data-cy="csc-group-announcement-cfucfna"]').click()
        cy.get('div[data-cy="csc-group-announcement-cfucfna"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-group-announcement-cfucfna"][aria-checked="false"]').should('exist')

        cy.get('div[data-cy="csc-group-announcement-callsetup"]').click()
        cy.get('div[data-cy="csc-group-announcement-callsetup"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-group-announcement-callsetup"][aria-checked="true"]').should('exist')

        cy.get('div[data-cy="csc-group-announcement-callsetup"]').click()
        cy.get('div[data-cy="csc-group-announcement-callsetup"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="csc-group-announcement-callsetup"][aria-checked="false"]').should('exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Preferences Tab: Save and reset Hunt Policy/Timeout, Cancel Mode, Max Participants and PIN', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()

        cy.qSelect({ dataCy: 'csc-group-hunt-policy', itemContains: 'Circular Ringing' })
        cy.get('span[class="block"]').contains('Reset').click()
        cy.get('input[aria-label="Hunt Policy"][value="Serial Ringing"]').should('exist')
        cy.qSelect({ dataCy: 'csc-group-hunt-policy', itemContains: 'Circular Ringing' })
        cy.get('span[class="block"]').contains('Save').click()
        cy.get('input[aria-label="Hunt Policy"][value="Circular Ringing"]').should('exist')

        cy.get('input[data-cy="csc-group-hunt-timeout"]').clear().type('20')
        cy.get('span[class="block"]').contains('Save').click()
        cy.get('input[data-cy="csc-group-hunt-timeout"][value="20"]').should('exist')
        cy.get('input[data-cy="csc-group-hunt-timeout"]').type('30')
        cy.get('span[class="block"]').contains('Reset').click()
        cy.get('input[data-cy="csc-group-hunt-timeout"][value="20"]').should('exist')

        cy.qSelect({ dataCy: 'csc-group-cancel-mode', itemContains: 'Using Bye' })
        cy.get('span[class="block"]').contains('Reset').click()
        cy.get('input[aria-label="Cancel Mode"][value="Using Cancel"]').should('exist')
        cy.qSelect({ dataCy: 'csc-group-cancel-mode', itemContains: 'Using Bye' })
        cy.get('span[class="block"]').contains('Save').click()
        cy.get('input[aria-label="Cancel Mode"][value="Using Bye"]').should('exist')

        cy.get('input[data-cy="csc-group-max-conference-participants"]').type('10')
        cy.get('span[class="block"]').contains('Save').click()
        cy.get('input[data-cy="csc-group-max-conference-participants"][value="10"]').should('exist')
        cy.get('input[data-cy="csc-group-max-conference-participants"]').type('50')
        cy.get('span[class="block"]').contains('Reset').click()
        cy.get('input[data-cy="csc-group-max-conference-participants"][value="10"]').should('exist')

        cy.get('input[data-cy="csc-group-conference-pin"]').type('asdf')
        cy.get('div[role="alert"]').contains('Conference PIN must consist of numeric characters only').should('exist')
        cy.get('input[data-cy="csc-group-conference-pin"]').clear().type('1234')
        cy.get('span[class="block"]').contains('Save').click()
        cy.get('input[data-cy="csc-group-conference-pin"][value="1234"]').should('exist')
        cy.get('input[data-cy="csc-group-conference-pin"]').type('5432')
        cy.get('span[class="block"]').contains('Reset').click()
        cy.get('input[data-cy="csc-group-conference-pin"][value="1234"]').should('exist')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('CF Tab: Add and delete available, not available and busy call forwarding', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()
        cy.get('div[data-cy="q-tab-call-forwards"]').click()

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

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Voicemail Tab: Enable/Disable attach/delete voicemail', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()
        cy.get('div[data-cy="q-tab-voicebox"]').click()

        cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="voicebox-attach-file"][aria-checked="true"]').should('be.visible')
        cy.get('div[data-cy="voicebox-attach-file"]').click()

        cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="voicebox-attach-file"][aria-checked="false"]').should('be.visible')
        cy.get('div[data-cy="voicebox-attach-file"]').click()

        cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="voicebox-attach-file"][aria-checked="true"]').should('be.visible')
        cy.get('div[data-cy="voicebox-delete-file"][aria-checked="false"]').should('be.visible')
        cy.get('div[data-cy="voicebox-delete-file"]').click()

        cy.get('div[data-cy="voicebox-delete-file"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="voicebox-delete-file"][aria-checked="true"]').should('be.visible')
        cy.get('div[data-cy="voicebox-delete-file"]').click()

        cy.get('div[data-cy="voicebox-delete-file"][aria-disabled="true"]').should('not.exist')
        cy.get('div[data-cy="voicebox-delete-file"][aria-checked="false"]').should('be.visible')
        cy.get('div[data-cy="voicebox-delete-file"]').click()

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Fax2Mail Tab: Try to disable and enable T38 and ECM', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()
        cy.get('div[data-cy="q-tab-fax-2-mail"]').click()

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
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })

    it('Mail2Fax: Add Secret Key and change renew interval', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()
        cy.get('div[class="csc-list-item-title"]').click()
        cy.get('div[data-cy="q-tab-mail-2-fax"]').click()

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
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })


    it('Delete a PBX Group', function () {
        if (!iscloudpbx) {
            this.skip()
        }

        // Setup: Create Subscribers and group
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSubscriber({ data: pbxGroup, authHeader })
        })

        cy.visit('/')

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/groups"]').click()

        cy.get('div[class="csc-list-item-title"]').contains(pbxGroup.username).should('be.visible')

        cy.get('button[data-cy="q-btn"]:last').click()
        cy.get('div[data-cy="base-transition"]').contains('Remove').click()
        cy.get('button[data-cy="csc-dialog-delete"]').click()

        cy.get('div[class="row justify-center csc-no-entities"]').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSubscriberBy({ name: pbxGroup.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber.username, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
        })
    })
})
