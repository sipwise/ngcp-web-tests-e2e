/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    deleteDownloadsFolder,
    deleteItemOnListPageBy, clickDataTableSelectedMoreMenuItem, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateAdmin,
    apiCreateSystemContact,
    apiCreateContract,
    apiCreateReseller,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiRemoveResellerBy
} from '../../support/ngcp-admin-ui/utils/api'

const path = require('path')
const ngcpConfig = Cypress.config('ngcpConfig')

const admin1 = {
    role: 'admin',
    password: 'rand0mpassword12345',
    newpass: 'te#sTpaw0r4638',
    email: 'user' + getRandomNum() + '@example.com',
    login: 'admin' + getRandomNum(),
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const admin2 = {
    login: 'admin' + getRandomNum(),
    password: 'rand0mpAsswo1234',
    role: 'reseller',
    is_master: true,
    reseller_id: null
}

const mainResellerAdmin = {
    login: 'admin' + getRandomNum(),
    password: 'rand0mpasswO12345',
    role: 'reseller',
    is_master: true,
    is_active: true,
    show_passwords: true,
    call_data: true,
    billing_data: true,
    reseller_id: null
}

const secondaryresellerAdmin = {
    login: 'admin' + getRandomNum(),
    password: 'rand0mpasswO1234',
    role: 'reseller',
    is_master: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    billing_data: true,
    reseller_id: null
}

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const contact = {
    email: 'user' + getRandomNum() + '@example.com'
}

const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const downloadsFolder = Cypress.config('downloadsFolder')

context('Administrator tests', () => {
    context('Simple UI admin tests', () => {

    })

    context('Test admin actions as normal admin', () => {
        // IMPORTANT: all tests in this suite are dependent to each other, so we cannot execute them individually

        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: contact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            admin2.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateAdmin({ data: admin1, authHeader })
                apiCreateAdmin({ data: admin2, authHeader })
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
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: contact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin1.login, authHeader })
                apiRemoveAdminBy({ name: admin2.login, authHeader })
            })
        })

        it('Create an administrator', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin1.login, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            clickToolbarActionButton('admin-creation')

            cy.locationShouldBe('#/administrator/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="login-field"] input').type(admin1.login)
            cy.get('[data-cy="password-field"] input').type(admin1.password)
            cy.get('[data-cy="password-retype-field"] input').type(admin1.password)
            cy.qSelect({ dataCy: 'roles-list', filter: 'admin', itemContains: 'admin' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Check that administrator is not permitted to change their own permissions', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="aui-data-table-inline-edit--toggle"]:first').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"]:first[aria-checked="true"]').should('be.visible')
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')

            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            cy.get('[data-cy="aui-close-button"]').click()
            waitPageProgress()
            cy.get('div[data-cy="aui-data-table-inline-edit--toggle"]:first[aria-checked="true"]').should('be.visible')
        })

        it('Make sure that reseller admins cannot change permissions from reseller admins with different resellers', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')

            waitPageProgress()
            cy.qSelect({ dataCy: 'roles-list', filter: 'reseller', itemContains: 'reseller' })

            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin2.login)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
        })

        it('Deactivate administrator and check if administrator is deactivated', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="active-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(admin1.login, admin1.password, false)
            cy.get('[data-cy=aui-input-password] div[role="alert"]').should('be.visible')
        })

        xit('Enable customer care for administrator and check if customer care has been activated', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.qSelect({ dataCy: 'roles-list', filter: 'ccareadmin', itemContains: 'ccareadmin' })

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(admin1.login, admin1.password)
            cy.contains('Settings').click()
            cy.get('a[href="#/customer"]').should('be.visible')
            cy.get('a[href="#/subscriber"]').should('be.visible')
        })

        xit('Enable read-only for administrator and check if read-only has been activated', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('[data-cy="readonly-flag"]').click()
            cy.get('div[data-cy="readonly-flag"][aria-checked="true"]').should('be.visible')
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(admin1.login, admin1.password)

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

        it('Make sure that admins cannot change other admins password', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-data-table-row-menu--adminChangePassword"]').should('not.exist')
        })

        it('Change password of administrator and check if admin password has been changed', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminChangePassword')

            cy.get('input[data-cy="password-input"]').type('test')
            cy.get('[data-cy="vue-password-strength-meter"]').should('be.visible')
            cy.get('input[data-cy="password-input"]').clear().type(admin1.newpass)
            cy.get('input[data-cy="password-retype-input"]').type(admin1.newpass)
            cy.get('[data-cy="save-button"]').click()
            cy.get('div[data-cy="change-password-form"]').should('not.exist')
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.login(admin1.login, admin1.newpass)
            cy.url().should('match', /\/#\/dashboard/)
        })

        it('Make sure that admins cannot delete themselves', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('delete')
            cy.get('[data-cy="btn-confirm"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
        })

        it('Delete administrator and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin1.login)
        })
    })

    context('Test admin actions as reseller admin', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: contact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            mainResellerAdmin.reseller_id = id
                            secondaryresellerAdmin.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateAdmin({ data: mainResellerAdmin, authHeader })
                apiCreateAdmin({ data: secondaryresellerAdmin, authHeader })
            })
        })

        after(() => {
            // let's remove all data via API
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: mainResellerAdmin.login, authHeader })
                apiRemoveAdminBy({ name: secondaryresellerAdmin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: contact.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: secondaryresellerAdmin.login, authHeader })
                apiRemoveAdminBy({ name: mainResellerAdmin.login, authHeader })
            })
        })

        it('Check if reseller admin is not allowed to change their own permissions (with is_master=true/false)', () => {
            cy.login(mainResellerAdmin.login, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('div[role="alert"] button').click()
            searchInDataTable(mainResellerAdmin.login)
            cy.get('td[data-cy="q-td--is-master"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-negative')
            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(secondaryresellerAdmin.login, secondaryresellerAdmin.password)
            cy.get('a[data-cy="aui-main-menu-item--dashboard"]').click()
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('input[data-cy="aui-input-search--datatable"]').clear()
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('td[data-cy="q-td--is-master"] div').should('have.attr', 'aria-disabled', 'true')
        })

        it('Create a reseller admin (is_master=false) and check if permissions are correct', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: secondaryresellerAdmin.login, authHeader })
            })
            cy.login(mainResellerAdmin.username, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            clickToolbarActionButton('admin-creation')

            cy.locationShouldBe('#/administrator/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
            cy.get('[data-cy="login-field"] input').type(secondaryresellerAdmin.login)
            cy.qSelect({ dataCy: 'roles-list', filter: secondaryresellerAdmin.reseller_id, itemContains: 'reseller' })
            cy.get('[data-cy="password-field"] input').type(secondaryresellerAdmin.password)
            cy.get('[data-cy="password-retype-field"] input').type(secondaryresellerAdmin.password)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(secondaryresellerAdmin.login, secondaryresellerAdmin.password)
            cy.get('a[data-cy="aui-main-menu-item--dashboard"]').click()

            cy.get('div[data-cy="aui-main-menu-items--settings"]').click()
            cy.get('a[data-cy="aui-main-menu-item--admin-list"]').click()

            cy.locationShouldBe('#/administrator')
            cy.get('div[data-cy="aui-list-action--admin-creation"]').should('not.exist')
            cy.get('button[data-cy="row-more-menu-btn"]:first').click()
            cy.get('div[data-cy="aui-list-action--delete"]').should('not.exist')
            cy.get('a[data-cy="aui-data-table-row-menu--adminEdit"]').click()

            waitPageProgress()
            cy.get('label[data-cy="aui-select-reseller"]').should('not.exist')
            cy.get('div[data-cy="roles-list"]').should('not.exist')
            cy.get('label[data-cy="password-field"]').should('not.exist')
            cy.get('div[data-cy="master-flag"]').should('not.exist')
            cy.get('div[data-cy="active-flag"]').should('not.exist')
            cy.get('div[data-cy="readonly-flag"]').should('not.exist')
            cy.get('div[data-cy="show-password-flag"]').should('not.exist')
            cy.get('div[data-cy="can-reset-password-flag"]').should('not.exist')
            cy.get('div[data-cy="show-cdrs-flag"]').should('not.exist')
            cy.get('div[data-cy="show-billing-info-flag"]').should('not.exist')
        })

        it('Enable master for reseller admin and check if permission is applied correctly', () => {
            cy.login(mainResellerAdmin.login, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('[data-cy="master-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(secondaryresellerAdmin.login, secondaryresellerAdmin.password)
            cy.get('a[data-cy="aui-main-menu-item--dashboard"]').click()

            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('div[data-cy="aui-list-action--admin-creation"]').should('be.visible')
            cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').should('be.visible')
            cy.get('div[data-cy="aui-list-action--delete"]').should('be.visible')
            cy.get('button[data-cy="row-more-menu-btn"]:first').should('be.visible')
        })

        it('Deactivate reseller admin and check if admin is deactivated', () => {
            cy.login(mainResellerAdmin.username, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="active-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.logoutUI()
            cy.wait(500)
            cy.loginUI(secondaryresellerAdmin.login, secondaryresellerAdmin.password, false)
            cy.get('[data-cy=aui-input-password] div[role="alert"]').should('be.visible')
        })

        it('Enter admin email', () => {
            cy.login(mainResellerAdmin.username, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('input[data-cy="email-field"]').type('testemail@invalid.com')

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        xit('First check if password reset is disabled, then enable password reset for reseller admin and check if permission is applied correctly', () => {
            // Test will be unlocked when permissions in regards to password reset are fixed
            cy.login(mainResellerAdmin.login, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(mainResellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            cy.get('div[data-cy="aui-data-table-row-menu--change-password"]').should('not.exist')
            cy.logoutUI()

            cy.login(mainResellerAdmin.username, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')
            waitPageProgress()
            cy.get('div[data-cy="master-flag"]').click()
            cy.get('div[data-cy="can-reset-password-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()
            cy.get('button[data-cy="aui-close-button"]').click()

            cy.logoutUI()
            cy.login(secondaryresellerAdmin.login, secondaryresellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(secondaryresellerAdmin.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('change-password')
            cy.get('input[data-cy="password-input"]').type('averyshinynewpwd')
            cy.get('input[data-cy="password-retype-input"]').type('averyshinynewpwd')
            cy.get('button[data-cy="save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Delete reseller admin and check if they are deleted', () => {
            cy.login(mainResellerAdmin.username, mainResellerAdmin.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(secondaryresellerAdmin.login)
        })
    })

    context('Admin certificates tests', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: contact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            apiCreateAdmin({ data: { ...admin1, reseller_id: id }, authHeader })
                        })
                    })
                })
            })
        })

        after(() => {
            // let's remove all data via API
            cy.log('Data clean up...')
            deleteDownloadsFolder()
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin1.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: contact.email, authHeader })
            })
        })

        it('Create and Download API certificate from second administrator', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminChangeCertificate')
            cy.get('[data-cy="create-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            const filename = path.join(downloadsFolder, 'ngcp-api-certificate.zip')
            cy.readFile(filename, 'binary', { timeout: 1000 })
                .should(buffer => expect(buffer.length).to.be.gt(7500))
            cy.task('validateZipFile', filename) // has to be done separately, due to needing filesystem permissions
        })

        it('Manually download/revoke certificate and check if it downloads properly', () => {
            cy.login(admin1.login, admin1.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminChangeCertificate')
            cy.get('[data-cy="download-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            const filename = path.join(downloadsFolder, 'ngcp-ca.pem')
            cy.readFile(filename, 'binary', { timeout: 1000 })
                .should(buffer => expect(buffer.length).to.be.gt(1500))
            cy.get('[data-cy="revoke-certificate"]').click()
            cy.get('[data-cy="q-spinner-gears"]').should('not.exist')
            cy.get('[data-cy="revoke-certificate"]').should('not.exist')
            cy.get('[data-cy="create-certificate"]').should('be.visible')
        })

        it('Make sure that other admins are not able to add/remove the API Certificate', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin1.login)
            cy.get('[data-cy="row-more-menu-btn"]:first').click()
            cy.get('[data-cy="aui-data-table-row-menu--adminChangeCertificate"]').should('not.exist')
        })
    })
})
