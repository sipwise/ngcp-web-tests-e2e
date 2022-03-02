/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    deleteItemOnListPageByName,
    searchInDataTable,
    clickToolbarActionButton
} from '../../support/ngcp-admin-ui/utils/common'

const ngcpConfig = Cypress.config('ngcpConfig')

const profile = {
    setName: 'set' + getRandomNum(),
    descriptionInitial: 'testdescription' + getRandomNum(),
    description: 'testdescription' + getRandomNum(),
    profilename: 'profile' + getRandomNum(),
    profilename2: 'secondprofile' + getRandomNum()

}

context('Subscriber profile tests', () => {
    context('UI subscriber profile tests', () => {
        before(() => {
            // TODO: add API creation of customer and subscriber before running tests
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        after(() => {
            // TODO: add API cleanup of customer and subscirber after tests ran
        })

        it('Create subscriber profile set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            clickToolbarActionButton('subscriber-profile-set-create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="profile-set-name"]input').type(profile.setName)
            cy.get('[data-cy="profile-set-description"]input').type(profile.descriptionInitial)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.locationShouldBe('#/subscriberprofile')
        })

        it('Edit subscriber profile set', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profile.setName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--subscriber-profile-set-edit"]').click()
            cy.get('[data-cy="profile-set-description"]input').clear().type(profile.description)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Profile saved successfully').should('be.visible')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.contains('[data-cy="q-td--description"]', profile.description).should('be.visible')
        })

        it('Create subscriber profile', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')
            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profile.setName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--subscriber-profiles-list"]').click()
            waitPageProgress()
            clickToolbarActionButton('subscriber-profiles-create')
            cy.get('[data-cy="profile-name"]input').type(profile.profilename)
            cy.get('[data-cy="profile-description"]input').type(profile.description)
            cy.get('div[aria-label="block_in_list"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Create a second subscriber profile and mark it as default', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            searchInDataTable(profile.setName)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--subscriber-profiles-list"]').click()
            waitPageProgress()
            clickToolbarActionButton('subscriber-profiles-create')
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

        it('Delete subscriber profile set and check if they are deleted', () => { // TODO: replace this entire "test" with one API call to make it faster and less prone to errors
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / subscriber-profile-set-list')

            cy.locationShouldBe('#/subscriberprofile')
            deleteItemOnListPageByName(profile.setName)
        })
    })
})
