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
} from '../../support/ngcp-csc-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

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

const fixturesFolder = Cypress.config('fixturesFolder')

context('Voicebox page tests', () => {
    context('UI Voicebox tests', () => {
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

        it('Switch between all Voicebox languages', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('German').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('German').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('English').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('English').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Spanish').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Spanish').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Italian').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Italian').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Romanian').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Romanian').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('French').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('French').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Arabic').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Arabic').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Hebrew').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Hebrew').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('Dutch').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('Dutch').should('be.visible')

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[data-cy="voicebox-change-language"]').click()
            cy.get('div[role="listbox"]').contains('use domain default').click()
            cy.get('label[data-cy="q-select"][aria-disabled="true"]').should('not.exist')
            cy.get('div[role="alert"]').contains('Language changed successfully').should('be.visible')
            cy.get('div[data-cy="voicebox-change-language"]').contains('use domain default').should('be.visible')
        })

        it('Change and Undo PIN', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('input[data-cy="voicebox-change-pin"]').clear()
            cy.get('input[data-cy="voicebox-change-pin"]').type('1234')
            cy.get('button').contains('Save').click()
            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[role="alert"]').contains('Changed PIN successfully.').should('be.visible')
            cy.get('input[data-cy="voicebox-change-pin"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('1234'))

            cy.get('input[data-cy="voicebox-change-pin"]').type('56')
            cy.get('button').contains('Save').click()
            cy.get('input[data-cy="voicebox-change-pin"][disabled]').should('not.exist')
            cy.get('div[role="alert"]').contains('Changed PIN successfully.').should('be.visible')
            cy.get('input[data-cy="voicebox-change-pin"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('123456'))

            cy.get('input[data-cy="voicebox-change-pin"]').type('78')
            cy.get('button').contains('Undo').click()
            cy.get('input[data-cy="voicebox-change-pin"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('123456'))
        })

        it('Change and Undo Email', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('input[data-cy="voicebox-change-email"][disabled]').should('not.exist')
            cy.get('input[data-cy="voicebox-change-email"]').type('invalidmail')
            cy.get('div[role="alert"]').contains('Input a valid email address').should('be.visible')
            cy.get('button').contains('Undo').click()

            cy.get('input[data-cy="voicebox-change-email"]').type('test.test@test.com')
            cy.get('button').contains('Save').click()
            cy.get('input[data-cy="voicebox-change-email"][disabled]').should('not.exist')
            cy.get('div[role="alert"]').contains('Changed email successfully').should('be.visible')
            cy.get('input[data-cy="voicebox-change-email"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('test.test@test.com'))

            cy.get('input[data-cy="voicebox-change-email"]').type('a')
            cy.get('button').contains('Save').click()
            cy.get('input[data-cy="voicebox-change-email"][disabled]').should('not.exist')
            cy.get('div[role="alert"]').contains('Changed email successfully').should('be.visible')
            cy.get('input[data-cy="voicebox-change-email"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('test.test@test.coma'))

            cy.get('input[data-cy="voicebox-change-email"]').type('sdf')
            cy.get('button').contains('Undo').click()
            cy.get('input[data-cy="voicebox-change-email"]')
                .invoke('val')
                .then(inputval => expect(inputval).to.eq('test.test@test.coma'))
        })

        it('Enable/Disable attach/delete voicemail', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-attach-file"]').click()

            cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-attach-file"][aria-checked="false"]').should('be.visible')
            cy.get('div[data-cy="voicebox-attach-file"]').click()

            cy.get('div[data-cy="voicebox-attach-file"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-attach-file"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="voicebox-delete-file"]').click()

            cy.get('div[data-cy="voicebox-delete-file"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-delete-file"][aria-checked="true"]').should('be.visible')
            cy.get('div[data-cy="voicebox-delete-file"]').click()

            cy.get('div[data-cy="voicebox-delete-file"][aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-delete-file"][aria-checked="false"]').should('be.visible')
            cy.get('div[data-cy="voicebox-delete-file"]').click()
        })

        it('Upload/Delete busy greeting sound', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('div[data-cy="voicebox-attach-file"] [aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-busy-greeting"] input[type="file"]').focus()
            cy.get('div[data-cy="voicebox-busy-greeting"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-fileselect-reset"]').click()
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-fileselect-select"]').should('be.visible')
            cy.get('div[data-cy="voicebox-busy-greeting"] input[type="file"]').focus()
            cy.get('div[data-cy="voicebox-busy-greeting"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-fileselect-upload"]').click()
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-player-play"]').click()
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-player-pause"]').should('be.visible')
            cy.wait(2000)
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-player-pause"]').click()
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-player-play"]').should('be.visible')
            cy.get('div[data-cy="voicebox-busy-greeting"] [data-cy="csc-player-stop"]').click()

            cy.get('button[data-cy="csc-fileselect-remove"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.get('button[data-cy="csc-fileselect-select"]').should('be.visible')
        })

        it('Upload/Delete unavailable greeting sound', () => {
            cy.loginUI(loginInfo.username, loginInfo.password)
            cy.get('a[href="#/user/dashboard"]').should('be.visible')

            cy.get('div[data-cy="q-item-label"]').contains('Call Settings').click()
            cy.get('a[href="#/user/voicebox"]').click()

            cy.get('div[data-cy="voicebox-attach-file"] [aria-disabled="true"]').should('not.exist')
            cy.get('div[data-cy="voicebox-unavailable-greeting"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-fileselect-reset"]').click()
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-fileselect-select"]').should('be.visible')
            cy.get('div[data-cy="voicebox-unavailable-greeting"] input[type="file"]').selectFile(path.join(fixturesFolder, 'ring.wav'), { force: true })
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-fileselect-upload"]').click()
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-player-play"]').click()
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-player-pause"]').should('be.visible')
            cy.wait(2000)
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-player-pause"]').click()
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-player-play"]').should('be.visible')
            cy.get('div[data-cy="voicebox-unavailable-greeting"] [data-cy="csc-player-stop"]').click()

            cy.get('button[data-cy="csc-fileselect-remove"]').click()
            cy.get('div[data-cy="q-card"]').contains('OK').click()
            cy.get('button[data-cy="csc-fileselect-select"]').should('be.visible')
        })
    })
})
