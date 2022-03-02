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
        cy.get('label[data-cy="aui-select-reseller"][error="true"]').should('be.visible')
        cy.get('label[data-cy="emergency-mapping-name"] div[role="alert"]').should('be.visible')
    })

    it('Create a new emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('[data-cy="aui-list-action--emergency-mapping-container-creation"]').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
        cy.get('[data-cy="emergency-mapping-name"] input').type(emergencymapname)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
    })

    it('Delete emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        cy.locationShouldBe('#/emergencymapping')
        deleteItemOnListPageByName(emergencymapname)
    })
})
