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
    apiCreateSoundSet,
    apiRemoveSoundSetBy
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
const fixturesFolder = Cypress.config('fixturesFolder')
const path = require('path')

const domain = {
    domain: 'domainSoundsetCSC',
    reseller_id: 1
}

const pbx_subscriber_pilot = {
    username: 'pbxsubscriberpilotSoundsetCSC',
    webusername: 'pbxsubscriberpilotSoundsetCSC',
    email: 'pbxsubscriberpilotSoundsetCSC@test.com',
    external_id: 'pbxsubscriberpilotSoundsetCSC',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    administrative: true,
    customer_id: 0,
    subscriber_id: 0,
    is_pbx_pilot: true,
    primary_number: {
        sn: 26,
        ac: 98,
        cc: 8594
    },
}

const pbxcustomer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'pbxCustomerSubscriberSoundsetCSC',
    contact_id: 1,
    status: 'active',
    type: 'pbxaccount'
}

const soundSet = {
	contract_default: false,
	copy_from_default: true,
    customer_id: 0,
	description: "This is a description of CSC soundset from Cyress tests",
	language: "it",
	loopplay: false,
	name: "soundsetTestCypressCSC",
    parent_id: null,
	replace_existing: false,
    reseller_id: 1
}

const loginInfo = {
    username: `${pbx_subscriber_pilot.webusername}@${pbx_subscriber_pilot.domain}`,
    password: `${pbx_subscriber_pilot.webpassword}`
}

context('Sound Set (CSC) page tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateDomain({ data: domain, authHeader })
            apiCreateCustomer({ data: pbxcustomer, authHeader }).then(({ id }) => {
                pbx_subscriber_pilot.customer_id = id
                soundSet.customer_id = id
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
            apiRemoveSubscriberBy({ name: pbx_subscriber_pilot.username, authHeader })
            apiCreateSubscriber({ data: pbx_subscriber_pilot, authHeader })
            apiCreateSoundSet({ data: soundSet, authHeader })
        })
        cy.visit('/')
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveCustomerBy({ name: pbxcustomer.external_id, authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
        })
    })

    it('Check if Sound Set with empty values gets rejected', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]').click()

        cy.get('button[data-cy="csc-sound-set-add"]').click()
        cy.get('button[data-cy="csc-sound-set-play-create"][aria-disabled="true"]').should('be.visible')
    })

    it('Create Sound Set', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
        })

        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]').click()

        cy.get('button[data-cy="csc-sound-set-add"]').click()
        cy.get('input[data-cy="csc-sound-set-name"]').should('be.visible')
        cy.get('input[data-cy="csc-sound-set-name"]').type(soundSet.name)
        cy.get('input[data-cy="csc-sound-set-description"]').type(soundSet.description)
        cy.get('div[data-cy="csc-sound-set-default"]').click()
        cy.get('div[data-cy="csc-sound-set-language-enable"]').click()
        cy.qSelect({ dataCy: 'csc-sound-set-language-dropdown', itemContains: 'Italian' })
        cy.get('div[data-cy="csc-sound-set-play-loop"]').should('be.visible')
        cy.get('div[data-cy="csc-sound-set-play-loop"]').click()
        cy.get('button[data-cy="csc-sound-set-play-create"]').click()
        cy.get('div[role="alert"]').contains('Created sound set ' + soundSet.name + ' successfully').should('be.visible')

        cy.get('div[class="csc-list-item-title"]').contains(soundSet.name).should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').contains(soundSet.description).should('be.visible')
        cy.get('div[class="csc-list-item-subtitle"]').find('div[aria-checked="true"]').should('be.visible')
        cy.get('div[class="csc-list-item-title"]').contains(soundSet.name).click()
        cy.get('div[data-cy="csc-list-item-title"]').contains('music_on_hold').click()
        cy.get('div[aria-label="Loop"][aria-checked="true"]').should('be.visible')
    })

    it('Edit Sound Set', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]').click()

        cy.get('div[class="csc-list-item-title"]').contains(soundSet.name).click()
        cy.get('div[data-cy="csc-sound-set-edit-default"]').click()
        cy.get('div[role="alert"]').contains('Updated default option for sound set ' + soundSet.name + ' successfully').should('be.visible')
        cy.get('div[data-cy="csc-list-item-title"]').contains('music_on_hold').click()
        cy.get('div[aria-label="Loop"]').click()
        cy.get('div[aria-label="Loop"][aria-checked="true"]').should('be.visible')
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]:last').click()
        cy.get('div[class="csc-list-item-subtitle"]').find('div[aria-checked="true"]').should('be.visible')
    })

    it('Upload a sound to a Sound Set', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]').click()

        cy.get('div[class="csc-list-item-title"]').contains(soundSet.name).click()
        cy.get('div[data-cy="csc-list-item-title"]').contains('music_on_hold').click()
        cy.get('div[class="csc-list-item-body-content"]').find('input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
        cy.get('button[type="button"] span').contains('Reset').click()
        cy.get('button[type="button"] span').contains('Upload').should('not.exist')
        cy.get('div[class="csc-list-item-body-content"]').find('input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
        cy.get('button[type="button"] span').contains('Upload').click()

        cy.get('button[data-cy="csc-player-play"]').click()
        cy.get('button[data-cy="csc-player-pause"]').should('be.visible')
        cy.wait(2000)
        cy.get('button[data-cy="csc-player-pause"]').click()
        cy.get('button[data-cy="csc-player-play"]').should('be.visible')
        cy.get('button[data-cy="csc-player-stop"]').click()

        cy.get('button[type="button"] span').contains('Remove').click()
        cy.get('button[data-cy="csc-player-play"]').should('not.exist')
        cy.get('button[data-cy="csc-player-stop"]').should('not.exist')
        cy.get('span').contains('No file attached').should('be.visible')
    })

    it('Delete Sound Set', () => {
        cy.loginUiCSC(loginInfo.username, loginInfo.password)
        cy.get('a[href="#/user/dashboard"]').should('be.visible')

        cy.get('div[data-cy="q-item-label"]').contains('PBX Configuration').click()
        cy.get('a[href="#/user/pbx-configuration/sound-sets"]').click()

        cy.get('div[class="csc-list-item-head-menu"] button').click()
        cy.get('div[data-cy="q-item-section"]').contains('Remove').click()
        cy.get('button[data-cy="csc-dialog-delete"]').click()

        cy.get('div[class="row justify-center csc-no-entities"]').contains('No sound sets created yet').should('be.visible')
        cy.get('div[class="csc-list-item-title"]').should('not.exist')
        cy.get('div[class="csc-list-item-subtitle"]').should('not.exist')
    })
})
