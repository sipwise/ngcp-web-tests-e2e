/// <reference types="cypress" />

import {
    apiCreateSubscriberProfileSet,
    apiLoginAsSuperuser,
    apiRemoveSubscriberProfileSetBy,
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageBy,
    searchInDataTable
} from '../../support/ngcp-admin-ui/e2e'

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
            cy.navigateMainMenu('settings / subscriberprofile')

            cy.locationShouldBe('#/subscriberprofile')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="profile-set-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="profile-set-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create subscriber profile set', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberProfileSetBy({ name: profileSet.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriberprofile')

            cy.locationShouldBe('#/subscriberprofile')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="profile-set-name"]input').type(profileSet.name)
            cy.get('[data-cy="profile-set-description"]input').type(profileSet.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/subscriberprofile')
        })

        it('Edit subscriber profile set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriberprofile')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--subscriberProfileSetEdit"]').click()
            cy.get('[data-cy="profile-set-description"]input').clear()
            cy.get('[data-cy="profile-set-description"]input').type(profileSet.descriptionNew)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Subscriber Profile Set saved successfully').should('be.visible')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--description"]', profileSet.descriptionNew).should('be.visible')
        })

        it('Check if subscriber profile with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriberprofile')
            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--subscriberProfileList"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('label[data-cy="profile-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="profile-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create two subscriber profiles and mark one as default', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriberprofile')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profileSet.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--subscriberProfileList"]').click()
            waitPageProgress()
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy="profile-name"]input').type(profile.profilename)
            cy.get('[data-cy="profile-description"]input').type(profile.description)
            cy.get('div[aria-label="block_in_list"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('a[data-cy="aui-list-action--add"]').click()
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
            cy.navigateMainMenu('settings / subscriberprofile')

            cy.locationShouldBe('#/subscriberprofile')
            deleteItemOnListPageBy(profileSet.name)
        })
    })
})
