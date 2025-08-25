/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateEmergencyMapping,
    apiCreateEmergencyMappingContainer,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveEmergencyMappingBy,
    apiRemoveEmergencyMappingContainerBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    clickDataTableSelectedMoreMenuItem,
    deleteItemOnListPageBy,
    searchInDataTable,
    waitPageProgressAUI
} from '../../../support/e2e'

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractEmMapping',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const emergencyMappingContainer = {
    name: 'EmergencyMCCypress',
    reseller_id: null
}

const emergencyMapping = {
    prefix: "prefixEmergencyMapping",
    code: 11,
    suffix: "suffixEmergencyMapping",
    emergency_container_id: 0
}

const editContract = {
    contact_id: 3,
    status: 'active',
    external_id: 'editContractEmergencyMapping',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const editReseller = {
    contract_id: 1,
    status: 'active',
    name: 'editResellerEmergencyMapping',
    enable_rtc: false
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerEmergencyMapping',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactEMC@example.com'
}

const ngcpConfig = Cypress.config('ngcpConfig')

context('Emergency mapping tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
            apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
            apiRemoveResellerBy({ name: editReseller.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: editContract.external_id, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Data clean up pre-tests completed')

            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        emergencyMappingContainer.reseller_id = id
                    })
                })
                apiCreateContract({ data: { ...editContract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...editReseller, contract_id: id }, authHeader })
                })
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            cy.log('Cleaning up db...')
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
            apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })

            cy.log('Seeding db...')
            apiCreateEmergencyMappingContainer({ data: emergencyMappingContainer, authHeader }).then(({ id }) => {
                apiCreateEmergencyMapping({ data: { ...emergencyMapping, emergency_container_id: id }, authHeader })
            })
        })
    })
    
    after(() => {
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
            apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
            apiRemoveResellerBy({ name: editReseller.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: editContract.external_id, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
    })

    it('Check if emergency mapping container with invalid values gets rejected', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('input[data-cy="emergency-mapping-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a new emergency mapping container', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
            apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
        cy.get('input[data-cy="emergency-mapping-name"]').type(emergencyMappingContainer.name)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
    })

    it('Edit emergency mapping container', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(emergencyMappingContainer.name, 'Name')
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--emergencyMappingContainerEdit"]').click()
        waitPageProgressAUI()
        cy.get('label[data-cy="aui-select-reseller"] i').contains('cancel').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: editReseller.name , itemContains: editReseller.name })
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        waitPageProgressAUI()
        cy.get('td[data-cy="q-td--reseller-name"]').contains(editReseller.name).should('be.visible')
    })

    it('Check if emergency mapping with invalid values gets rejected', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(emergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgressAUI()
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('input[data-cy="emergency-code"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a new emergency mapping', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(emergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgressAUI()
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('input[data-cy="emergency-code"]').type(emergencyMapping.code)
        cy.get('input[data-cy="emergency-prefix"]').type(emergencyMapping.prefix)
        cy.get('input[data-cy="emergency-suffix"]').type(emergencyMapping.suffix)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
    })

    it('Edit emergency mapping', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(emergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgressAUI()
        searchInDataTable(emergencyMapping.code, 'Number')
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--emergencyMappingEdit"]').click()
        waitPageProgressAUI()
        cy.get('input[data-cy="emergency-prefix"]').clear().type('testprefix')
        cy.get('input[data-cy="emergency-suffix"]').clear().type('testsuffix')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        waitPageProgressAUI()
        cy.get('td[data-cy="q-td--prefix"]').contains('testprefix').should('be.visible')
        cy.get('td[data-cy="q-td--suffix"]').contains('testsuffix').should('be.visible')
    })

    it('Delete emergency mapping', () => {
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(emergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgressAUI()
        deleteItemOnListPageBy(emergencyMapping.code)
    })

    it('Delete emergency mapping container', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: emergencyMapping.code, authHeader })
        })
        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        deleteItemOnListPageBy(emergencyMappingContainer.name)
    })
})
