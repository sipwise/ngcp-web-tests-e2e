/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateEmergencyMappingContainer,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveEmergencyMappingContainerBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum,
    deleteItemOnListPageBy
} from '../../support/ngcp-admin-ui/e2e'

const EmergencyMappingContainer = {
    name: 'emergency' + getRandomNum(),
    reseller_id: null
}

const contract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const systemContact = {
    email: 'contact' + getRandomNum() + '@example.com'
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Emergency mapping tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        EmergencyMappingContainer.reseller_id = id
                    })
                })
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiCreateEmergencyMappingContainer({ data: EmergencyMappingContainer, authHeader })
        })
    })

    after(() => {
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
        })
    })

    afterEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingContainerBy({ name: EmergencyMappingContainer.name, authHeader })
        })
    })

    it('Check if emergency mapping with invalid values gets rejected', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('input[data-cy="emergency-mapping-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a new emergency mapping container', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingContainerBy({ name: EmergencyMappingContainer.name, authHeader })
        })
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
        cy.get('input[data-cy="emergency-mapping-name"]').type(EmergencyMappingContainer.name)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
    })

    it('Delete emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        deleteItemOnListPageBy(EmergencyMappingContainer.name)
    })
})
