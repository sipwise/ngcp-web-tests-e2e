
const ngcpConfig = Cypress.config('ngcpConfig')
const authConfig = {
    username: ngcpConfig.username,
    password: ngcpConfig.password
}

context('EmergencyMappingContainers', () => {
    it('should create a new EmergencyMappingContainer', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.request({
            method: 'GET',
            url: ngcpConfig.apiHost + '/api/resellers/1',
            auth: authConfig
        }).its('body').as('defaultReseller').then(function () {
            const randomEmergencyMappingContainerName = 'EMC' + Date.now()
            cy.navigateMainMenu('settings / emergency-mapping-container-list')
            cy.locationShouldBe('#/emergencymapping')
            cy.get('[data-cy=aui-list-action--emergency-mapping-container-creation]').click()
            cy.intercept('/reseller/ajax*').as('filterResellers')
            cy.get('[data-cy=aui-select-reseller] input').type(this.defaultReseller.name)
            cy.wait('@filterResellers').its('response.statusCode').should('eq', 200)
            cy.wait('@filterResellers').its('response.statusCode').should('eq', 200)
            cy.get('[data-cy=aui-select-reseller]').then($el => {
                cy.get(`#${$el.attr('for')}_lb .q-item`).eq(0).click()
            })
            cy.get('[data-cy=aui-new-emergency-mapping-container]')
                .get('[data-cy=aui-base-form-field]:eq(1) input')
                .type(randomEmergencyMappingContainerName)
            cy.intercept('/api/emergencymappingcontainers', {
                statusCode: 200,
                body: {
                    name: randomEmergencyMappingContainerName
                }
            }).as('emergencyMappingContainerCreation')
            cy.get('[data-cy=aui-save-button]').click()
            cy.wait('@emergencyMappingContainerCreation')
            cy.locationShouldBe('#/emergencymapping')
        })
    })
})
