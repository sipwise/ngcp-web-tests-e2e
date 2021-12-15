
const ngcpConfig = Cypress.config('ngcpConfig')
const authConfig = {
    username: ngcpConfig.username,
    password: ngcpConfig.password
}

context('Domains', () => {
    it('should create a new Domain', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.request({
            method: 'GET',
            url: ngcpConfig.apiHost + '/api/resellers/1',
            auth: authConfig
        }).its('body').as('defaultReseller').then(function () {
            const randomDomainName = 'domain' + Date.now()
            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('[data-cy=aui-list-action--domain-creation]').click()
            cy.intercept('/reseller/ajax*').as('filterResellers')
            cy.get('[data-cy=aui-select-reseller] input').type(this.defaultReseller.name)
            cy.wait('@filterResellers').its('response.statusCode').should('eq', 200)
            cy.wait('@filterResellers').its('response.statusCode').should('eq', 200)
            cy.get('[data-cy=aui-select-reseller]').then($el => {
                cy.get(`#${$el.attr('for')}_lb .q-item`).eq(0).click()
            })
            cy.get('[data-cy=aui-new-domain] .q-item:eq(1) input').type(randomDomainName)
            cy.intercept('/api/domains', {
                statusCode: 200,
                body: {
                    name: randomDomainName
                }
            }).as('domainCreation')
            cy.get('[data-cy=aui-save-button]').click()
            cy.wait('@domainCreation')
            cy.locationShouldBe('#/domain')
        })
    })
})
