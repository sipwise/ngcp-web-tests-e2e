/// <reference types="cypress" />
//TODO: add timeset events when timeset events page gets ported
import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiCreateTimeset,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    apiRemoveTimesetBy,
    deleteItemOnListPageBy,
    getRandomNum,
    searchInDataTable,
    waitPageProgress
} from '../../support/ngcp-admin-ui/e2e'
import { contract, reseller } from '../../support/aui-test-data';

const ngcpConfig = Cypress.config('ngcpConfig')

const editContract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const editReseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const timeset = {
    name: 'timeset' + getRandomNum(),
    reseller_id: 0
}

// We are not exporting this object to avoid dependencies
// if we run tests in parallel in the future
const systemContactDependency = {
    email: 'systemContactDependencyTimesets@example.com'
}

context('Timeset tests', () => {
    context('UI timeset tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveTimesetBy({ name: timeset.name, authHeader })
                apiRemoveResellerBy({ name: editReseller.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: editContract.external_id, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                //TODO find a way to delete contacts without receiving error: LOCKED - contact still in use  
                // apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            timeset.reseller_id = id
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
                apiCreateTimeset({data: timeset, authHeader})
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
                apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: editReseller.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: editContract.external_id, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                //TODO find a way to delete contacts without receiving error: LOCKED - contact still in use  
                // apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveTimesetBy({ name: timeset.name, authHeader })
            })
        })

        it('Check if timeset with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / timeset')
            cy.locationShouldBe('#/timeset')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="timeset-name"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a timeset', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveTimesetBy({ name: timeset.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / timeset')
            cy.locationShouldBe('#/timeset')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="timeset-name"]').type(timeset.name)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Edit timeset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / timeset')
            cy.locationShouldBe('#/timeset')
            searchInDataTable(timeset.name)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--timeSetEdit"]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('button:first').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: editReseller.name, itemContains: editReseller.name })
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('td[data-cy="q-td--reseller-name"]').contains(editReseller.name).should('be.visible')
        })

        it('Delete timeset', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / timeset')
            cy.locationShouldBe('#/timeset')
            deleteItemOnListPageBy(timeset.name)
        })
    })
})
