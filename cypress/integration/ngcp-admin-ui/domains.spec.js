
const ngcpConfig = Cypress.config('ngcpConfig')

context('Domains', () => {
    it('should create a new Domain', () => {
        const randomString = Date.now()
        cy.intercept('/reseller/ajax*').as('getResellers')
        cy.intercept('/api/domains').as('domainCreation')
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / domain-list')
        // Open creation form
        cy.get('[data-cy=aui-list-action--domain-creation]').click()
        cy.get('[data-cy=aui-select-reseller]').click()
        cy.wait('@getResellers')
        // Select default reseller
        cy.get('.q-menu .q-item').eq(0).click()
        // Input domain
        cy.get('.q-item > .q-item__section > .q-field:eq(1) input').type('domain' + randomString)
        cy.get('[data-cy=aui-save-button]').click()
        cy.wait('@domainCreation')
    })
})
