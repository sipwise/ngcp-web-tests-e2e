/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable,
    clickDataTableSelectedMoreMenuItem,
    clickToolbarActionButton
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateSubscriberProfileSet,
    apiLoginAsSuperuser,
    apiRemoveSubscriberProfileSetBy
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')

const profile = {
    descriptionInitial: 'testdescription' + getRandomNum(),
    description: 'testdescription' + getRandomNum(),
    profilename: 'profile' + getRandomNum(),
    profilename2: 'secondprofile' + getRandomNum()

}

const profileSet = {
    reseller_id: 1,
    description: 'testdescription' + getRandomNum(),
    descriptionNew: 'testdescription' + getRandomNum(),
    name: 'set' + getRandomNum()
}

context('Subscriber profile tests', () => {
    context('UI subscriber profile tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSubscriberProfileSet({ data: profileSet, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
            })
        })

        it('Check if subscriber profile set with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            clickToolbarActionButton('subscriber-profile-set-create')
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('label[data-cy="aui-select-reseller"][error="true"]').should('be.visible')
            cy.get('label[data-cy="profile-set-name"] div[role="alert"]').should('be.visible')
            cy.get('label[data-cy="profile-set-description"] div[role="alert"]').should('be.visible')
        })

        it('Create subscriber profile set', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            clickToolbarActionButton('subscriber-profile-set-create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="profile-set-name"]input').type(profileSet.name)
            cy.get('[data-cy="profile-set-description"]input').type(profileSet.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/subscriberprofile')
        })

        it('Edit subscriber profile set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('subscriberProfileSetEdit')
            cy.get('[data-cy="profile-set-description"]input').clear().type(profileSet.descriptionNew)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Subscriber Profile Set saved successfully').should('be.visible')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--description"]', profileSet.descriptionNew).should('be.visible')
        })

        it('Check if subscriber profile with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')
            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('subscriberProfileList')
            waitPageProgress()
            clickToolbarActionButton('subscriber-profile-create')
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('label[data-cy="profile-name"] div[role="alert"]').should('be.visible')
            cy.get('label[data-cy="profile-description"] div[role="alert"]').should('be.visible')
        })

        it('Create two subscriber profiles and mark one as default', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('subscriberProfileList')
            waitPageProgress()
            clickToolbarActionButton('subscriber-profile-create')
            cy.get('[data-cy="profile-name"]input').type(profile.profilename)
            cy.get('[data-cy="profile-description"]input').type(profile.description)
            cy.get('div[aria-label="block_in_list"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            clickToolbarActionButton('subscriber-profile-create')
            cy.get('[data-cy="profile-name"]input').type(profile.profilename2)
            cy.get('[data-cy="profile-description"]input').type(profile.description)
            cy.get('[data-cy="profile-set-default-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            searchInDataTable(profile.profilename)
            cy.get('[data-cy="aui-data-table-inline-edit--toggle"]:eq(0)[aria-checked="false"]').should('be.visible')
            searchInDataTable(profile.profilename2)
            cy.get('[data-cy="aui-data-table-inline-edit--toggle"]:eq(0)[aria-checked="true"]').should('be.visible')
        })

        it('Delete subscriber profile set and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            deleteItemOnListPageBy(profileSet.name)
        })
    })
})
