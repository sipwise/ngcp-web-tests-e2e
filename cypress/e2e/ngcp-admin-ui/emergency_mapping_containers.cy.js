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
    getRandomNum,
    searchInDataTable,
    waitPageProgress
} from '../../support/ngcp-admin-ui/e2e'

const EmergencyMappingContainer = {
    name: 'emergency' + getRandomNum(),
    reseller_id: null
}

const EmergencyMapping = {
    prefix: "prefix" + getRandomNum(),
    code: getRandomNum(),
    suffix: "suffix" + getRandomNum(),
    emergency_container_id: 0
}

const contract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const editcontract = {
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

const editreseller = {
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
                apiCreateContract({ data: { ...editcontract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...editreseller, contract_id: id }, authHeader })
                })
            })
        })
    })

    beforeEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiCreateEmergencyMappingContainer({ data: EmergencyMappingContainer, authHeader }).then(({ id }) => {
                apiCreateEmergencyMapping({ data: { ...EmergencyMapping, emergency_container_id: id }, authHeader })
            })
        })
    })

    after(() => {
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: editreseller.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: editcontract.external_id, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
        })
    })

    afterEach(() => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: EmergencyMapping.code, authHeader })
            apiRemoveEmergencyMappingContainerBy({ name: EmergencyMappingContainer.name, authHeader })
        })
    })

    it('Check if emergency mapping container with invalid values gets rejected', () => {
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
            apiRemoveEmergencyMappingBy({ name: EmergencyMapping.code, authHeader })
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

    it('Edit emergency mapping container', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(EmergencyMappingContainer.name, 'Name')
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--emergencyMappingContainerEdit"]').click()
        waitPageProgress()
        cy.get('label[data-cy="aui-select-reseller"] button:first').click()
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: editreseller.name , itemContains: editreseller.name })
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        waitPageProgress()
        cy.get('td[data-cy="q-td--reseller-name"]').contains(editreseller.name).should('be.visible')
    })

    it('Check if emergency mapping with invalid values gets rejected', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(EmergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgress()
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('input[data-cy="emergency-code"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
    })

    it('Create a new emergency mapping', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: EmergencyMapping.code, authHeader })
        })
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(EmergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgress()
        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('input[data-cy="emergency-code"]').type(EmergencyMapping.code)
        cy.get('input[data-cy="emergency-prefix"]').type(EmergencyMapping.prefix)
        cy.get('input[data-cy="emergency-suffix"]').type(EmergencyMapping.suffix)
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
    })

    it('Edit emergency mapping', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(EmergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgress()
        searchInDataTable(EmergencyMapping.code, 'Number')
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--emergencyMappingEdit"]').click()
        waitPageProgress()
        cy.get('input[data-cy="emergency-prefix"]').clear().type('testprefix')
        cy.get('input[data-cy="emergency-suffix"]').clear().type('testsuffix')
        cy.get('[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        cy.get('[data-cy="aui-close-button"]').click()
        waitPageProgress()
        cy.get('td[data-cy="q-td--prefix"]').contains('testprefix').should('be.visible')
        cy.get('td[data-cy="q-td--suffix"]').contains('testsuffix').should('be.visible')
    })

    it('Delete emergency mapping', () => {
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        searchInDataTable(EmergencyMappingContainer.name)
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        clickDataTableSelectedMoreMenuItem('emergencyMappingList')
        waitPageProgress()
        deleteItemOnListPageBy(EmergencyMapping.code)
    })

    it('Delete emergency mapping container', () => {
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveEmergencyMappingBy({ name: EmergencyMapping.code, authHeader })
        })
        cy.login(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / emergencymapping')
        cy.locationShouldBe('#/emergencymapping')
        deleteItemOnListPageBy(EmergencyMappingContainer.name)
    })
})
