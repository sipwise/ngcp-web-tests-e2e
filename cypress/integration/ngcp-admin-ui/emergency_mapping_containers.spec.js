
const ngcpConfig = Cypress.config('ngcpConfig')

context('EmergencyMappingContainers', () => {
    it('should create a new EmergencyMappingContainer', () => {
        const randomString = Date.now()
        cy.intercept('/reseller/ajax*').as('getResellers')
        cy.intercept('/api/emergencymappingcontainers').as('emergencyMappingContainerCreation')
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergency-mapping-container-list')
        // Open creation form
        cy.get('[data-cy=aui-list-action--emergency-mapping-container-creation]').click()
        cy.get('[data-cy=aui-select-reseller]').click()
        cy.wait('@getResellers')
        // Select default reseller
        cy.get('.q-menu .q-item').eq(0).click()
        // Input EmergencyMappingContainer name
        cy.get('[data-cy=aui-base-form-field]:eq(1) input').type('EMC' + randomString)
        cy.get('[data-cy=aui-save-button]').click()
        cy.wait('@emergencyMappingContainerCreation')
    })
})
