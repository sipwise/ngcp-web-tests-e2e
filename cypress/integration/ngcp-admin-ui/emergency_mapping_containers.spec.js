/// <reference types="cypress" />

import {
    getRandomNum,
    deleteItemOnListPageByName,
    waitPageProgress
} from '../../support/ngcp-admin-ui/utils/common'

const ngcpConfig = Cypress.config('ngcpConfig')

const emergencymapname = 'emergency' + getRandomNum()

context('Emergency mapping tests', () => {
    it('Check if emergency mapping with invalid values gets rejected', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('[data-cy="aui-list-action--emergency-mapping-container-creation"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.contains('[data-cy="aui-emergency-mapping-container-creation"] div[role="alert"]', 'Input is required').should('be.visible')
    })

    it('Create a new emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('[data-cy="aui-list-action--emergency-mapping-container-creation"]').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
        cy.get('[data-cy="emergency-mapping-name"] input').type(emergencymapname)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.contains('.q-notification', 'Emergency Mapping Container created successfully').should('be.visible')
    })

    it('Delete emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        cy.locationShouldBe('#/emergencymapping')
        deleteItemOnListPageByName(emergencymapname)
    })
})
