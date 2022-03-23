/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteDownloadsFolder,
    deleteItemOnListPageByName, clickDataTableSelectedMoreMenuItem, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateAdmin,
    apiCreateContract,
    apiCreateReseller,
    apiGetContractId,
    apiGetResellerId,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveContractBy,
    apiRemoveResellerBy
} from '../../support/ngcp-admin-ui/utils/api'

const path = require('path')
const ngcpConfig = Cypress.config('ngcpConfig')

const admin1 = {
    login: 'admin' + getRandomNum(),
    password: 'rand0mpassword1234',
    newpass: 'testpassw0rd12345'
}

const admin2 = {
    role: 'admin',
    password: 'rand0mpassword12345',
    email: 'user' + getRandomNum() + '@example.com',
    login: 'admin' + getRandomNum(),
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 0
}

const contract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const downloadsFolder = Cypress.config('downloadsFolder')

const uiCreateAdmin = ({ name, pass, resellerName, isSuperuser }) => {
    cy.navigateMainMenu('settings / admin-list')

    cy.locationShouldBe('#/administrator')
    clickToolbarActionButton('admin-creation')

    cy.locationShouldBe('#/administrator/create')
    cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: resellerName, itemContains: resellerName })
    cy.get('[data-cy="login-field"] input').type(name)
    cy.get('[data-cy="password-field"] input').type(pass)
    cy.get('[data-cy="password-retype-field"] input').type(pass)
    if (isSuperuser) {
        cy.qSelect({ dataCy: 'roles-list', filter: 'admin', itemContains: 'admin' })
    } else {
        cy.qSelect({ dataCy: 'roles-list', filter: 'reseller', itemContains: 'reseller' })
    }

    cy.get('[data-cy="aui-save-button"]').click()
    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
}

context('Administrator tests', () => {
    context('Simple UI admin tests', () => {

    })

    context('Complex UI admin tests', () => {
        // IMPORTANT: all tests in this suite are dependent to each other, so we cannot execute them individually

        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContract({ data: contract, authHeader })
                apiGetContractId({ name: contract.external_id, authHeader }).then(contractId => {
                    reseller.contract_id = contractId
                    return apiCreateReseller({ data: reseller, authHeader })
                })
                apiGetResellerId({ name: reseller.name, authHeader }).then(resellerId => {
                    admin2.resellerId = resellerId
                })
            })
        })

        // if a test in the group will fail we are not running others
        // Note: the Smart Orchestration is available for paid Cypress version only. So let's emulate part of it
        // afterEach(function skipAllTestsInGroupIfOneFailed () {
        //     // TODO: it will be nice to not remove tests but "skip" them
        //     // TODO: it will be nice to create a configurable plugin for this
        //     if (this.currentTest.state === 'failed') {
        //         this.currentTest.parent.testsQueue.length = 0
        //         // Cypress.runner.stop()
        //     }
        // })
        // TODO: let's comment this block for now, to be able to investigate the issue with two failing tests after applying the role based permission approach

        after(() => {
            // let's remove all data via API in case some of tests failed
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin1.login, authHeader })
                apiRemoveAdminBy({ name: admin2.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
            })
        })

        it('Create an administrator and enable superuser for this administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            uiCreateAdmin({ name: admin1.login, pass: admin1.password, resellerName: 'default', isSuperuser: true })
        })

        it('Create a second administrator with a different reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            uiCreateAdmin({ name: admin2.login, pass: admin2.password, resellerName: reseller.name, isSuperuser: false })
        })

        it('Check that administrator is not permitted to change their own permissions', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="aui-data-table-inline-edit--toggle"]:first').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"]:first[aria-checked="false"]').should('be.visible')
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')

            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"]:first[aria-checked="false"]').should('be.visible')
        })

        it('Set administrator to master', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')

            waitPageProgress()
            cy.qSelect({ dataCy: 'roles-list', filter: 'reseller', itemContains: 'reseller' })
            cy.get('[data-cy="master-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Log in and make sure that master admin cannot change permissions from admins with different resellers', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
        })

        it('Deactivate created administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="active-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Login with deactivated administrator', () => {
            cy.visit('/')
            // adding wait here, to be sure that inputs are intractable \ accessible
            cy.wait(500)

            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(admin1.login, admin1.password, false)

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('[data-cy=aui-input-password] div[role="alert"]').should('be.visible')
            })
        })

        it('Enable customer care for administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="active-flag"]').click()
            cy.qSelect({ dataCy: 'roles-list', filter: 'ccareadmin', itemContains: 'ccareadmin' })

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Check if customer care has been activated', () => {
            cy.login(admin1.login, admin1.password)
            cy.contains('Settings').click()
            cy.get('a[href="#/customer"]').should('be.visible')
            cy.get('a[href="#/subscriber"]').should('be.visible')
        })

        it('Enable read-only for administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')
            waitPageProgress()
            cy.qSelect({ dataCy: 'roles-list', filter: 'admin', itemContains: 'admin' })
            cy.get('[data-cy="readonly-flag"]').click()
            cy.get('div[data-cy="readonly-flag"][aria-checked="true"]').should('be.visible')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Check if read-only has been activated', () => {
            cy.login(admin1.login, admin1.password)

            cy.navigateMainMenu('settings / admin-list')
            cy.locationShouldBe('#/administrator')
            cy.get('div[data-cy^=aui-list-action]').should('not.exist')

            cy.navigateMainMenu('settings / customer-list')
            cy.locationShouldBe('#/customer')
            cy.get('div[data-cy=aui-list-action--customer-creation]').should('not.exist')
            cy.get('div[data-cy=aui-list-action--customer-edit]').should('not.exist')
            cy.get('div[data-cy=aui-list-action--delete]').should('not.exist')

            cy.navigateMainMenu('settings / contact-list')
            cy.locationShouldBe('#/contact')
            cy.get('div[data-cy^=aui-list-action]').should('not.exist')

            cy.navigateMainMenu('settings / domain-list')
            cy.locationShouldBe('#/domain')
            cy.get('div[data-cy=aui-list-action--domain-creation]').should('not.exist')
            cy.get('div[data-cy=aui-list-action--delete]').should('not.exist')
        })

        it('Disable read-only for administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="readonly-flag"]').click()
            cy.get('div[data-cy="readonly-flag"][aria-checked="false"]').should('be.visible')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Make sure that admins cannot change other admins password', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--change-password"]').should('not.exist')
        })

        it('Change password of administrator', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--change-password"]').click()

            cy.get('input[data-cy="password-input"]').type(admin1.newpass)
            cy.get('input[data-cy="password-retype-input"]').type(admin1.newpass)
            cy.get('[data-cy="save-button"]').click()
            cy.get('div[data-cy="change-password-form"]').should('not.exist')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Check if admin password has been changed', () => {
            cy.login(admin1.login, admin1.newpass)
            cy.url().should('match', /\/#\/dashboard/)
        })

        it('Make sure that admins cannot delete themselves', () => {
            cy.login(admin1.login, admin1.newpass)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--delete"]').click()
            cy.get('[data-cy="btn-confirm"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
        })

        it('Delete both administrators and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageByName(admin1.login)
            deleteItemOnListPageByName(admin2.login)
        })
    })

    context('Admin certificates tests', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContract({ data: contract, authHeader })
                apiGetContractId({ name: contract.external_id, authHeader }).then(contractId => {
                    reseller.contract_id = contractId
                })
                apiCreateReseller({ data: reseller, authHeader })
                apiGetResellerId({ name: reseller.name, authHeader }).then(resellerId => {
                    admin2.reseller_id = resellerId
                })
                apiCreateAdmin({ data: admin2, authHeader })
            })
        })

        beforeEach(deleteDownloadsFolder)

        after(() => {
            // let's remove all data via API
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin2.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
            })
            deleteDownloadsFolder()
        })

        it('Create and Download API certificate from second administrator', () => {
            cy.login(admin2.login, admin2.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--cert-management"]').click()
            cy.get('[data-cy="create-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            const filename = path.join(downloadsFolder, 'ngcp-api-certificate.zip')
            cy.readFile(filename, 'binary', { timeout: 1000 })
                .should(buffer => expect(buffer.length).to.be.gt(7500))
            cy.task('validateZipFile', filename) // has to be done separately, due to needing filesystem permissions
        })

        it('Manually download certificate and check if it downloads properly', () => {
            cy.login(admin2.login, admin2.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--cert-management"]').click()
            cy.get('[data-cy="download-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            const filename = path.join(downloadsFolder, 'ngcp-ca.pem')
            cy.readFile(filename, 'binary', { timeout: 1000 })
                .should(buffer => expect(buffer.length).to.be.gt(1500))
        })

        it('Make sure that other admins are not able to remove the API Certificate', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--cert-management"]').should('not.exist')
        })

        it('Revoke Certificate', () => {
            cy.login(admin2.login, admin2.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-popup-menu-item--cert-management"]').click()
            cy.get('[data-cy="revoke-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            cy.get('[data-cy="revoke-certificate"]').should('not.exist')
            cy.get('[data-cy="create-certificate"]').should('be.visible')
        })
    })
})
