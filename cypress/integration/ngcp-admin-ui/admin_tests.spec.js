/// <reference types="cypress" />

const ngcpConfig = Cypress.config('ngcpConfig')

const getRandomNum = (maxLength = 5) => Math.floor((Math.random() * Math.pow(10, maxLength)) + 1)

const admin1 = {
    name: 'admin' + getRandomNum(),
    pass: 'rand0mpassword1234'
}
const admin2 = {
    name: 'admin' + getRandomNum(),
    pass: 'rand0mpassword12345'
}
const resellerName = 'reseller' + getRandomNum()
const contractName = 'contract' + getRandomNum()

const waitPageProgress = () => {
    cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
    cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
}

const clickToolbarActionButton = (actionName) => {
    const selector = `div[data-cy=aui-list-action--${actionName}]`
    return cy
        .get(selector).should('not.have.attr', 'disable')
        .get(selector).click()
}

const apiLoginAsSuperuser = () => {
    return cy.loginAPI('administrator', 'administrator').then(({ jwt }) => {
        return {
            headers: {
                authorization: `Bearer ${jwt}`
            }
        }
    })
}

const apiRemoveAdminBy = ({ name, authHeader }) => {
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/admins`,
        qs: {
            login: name
        },
        ...authHeader
    }).then(({ body }) => {
        const adminId = body?._embedded?.['ngcp:admins']?.[0]?.id
        if (body?.total_count === 1 && adminId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/admins/${adminId}`,
                ...authHeader
            })
        } else {
            return null
        }
    })
}

const apiRemoveResellerBy = ({ name, authHeader }) => {
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellers`,
        qs: {
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerData = body?._embedded?.['ngcp:resellers']?.[0]
        const resellerId = resellerData?.id
        const resellerStatus = resellerData?.status
        if (body?.total_count === 1 && resellerId > 1 && resellerStatus !== 'terminated') {
            return cy.request({
                method: 'PATCH',
                url: `${ngcpConfig.apiHost}/api/resellers/${resellerId}`,
                body: [
                    { op: 'replace', path: '/status', value: 'terminated' }
                ],
                headers: {
                    ...authHeader.headers,
                    'content-type': 'application/json-patch+json'
                }
            })
        } else {
            return null
        }
    })
}

context('Administrator tests', () => {
    context('set of simple individual tests', () => { })

    context('complex UI administrator test suite', () => {
        // IMPORTANT: all tests in this suite are dependent to each other, so we cannot execute them individually

        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        // if a test in the group will fail we are not running others
        // Note: the Smart Orchestration is available for paid Cypress version only. So let's emulate part of it
        afterEach(function skipAllTestsInGroupIfOneFailed () {
            // TODO: it will be nice to not remove tests but "skip" them
            // TODO: it will be nice to create a configurable plugin for this
            if (this.currentTest.state === 'failed') {
                this.currentTest.parent.testsQueue.length = 0
                // Cypress.runner.stop()
            }
        })

        after(() => {
            // let's remove all data via API in case some of tests failed
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin1.name, authHeader })
                apiRemoveAdminBy({ name: admin2.name, authHeader })
                apiRemoveResellerBy({ name: resellerName, authHeader })
            })
        })

        it('Create a reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            clickToolbarActionButton('reseller-creation')

            cy.locationShouldBe('#/reseller/create')
            cy.get('[data-cy=aui-select-contract] [data-cy=aui-select-lazy-CreateBtn-dropdown]').click()
            cy.get('.q-menu [data-cy=aui-popup-menu-item--contract-create-reseller]').click()

            cy.locationShouldBe('#/contract/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-billing-profile-Active', filter: 'default', itemContains: 'Default Billing Profile' })
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default', itemContains: 'default-system' })
            cy.qSelect({ dataCy: 'contract-status', filter: '', itemContains: 'Pending' })
            cy.get('input[data-cy="external-num"]').type(contractName)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Contract created successfully').should('be.visible')

            cy.locationShouldBe('#/reseller/create')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contract', filter: contractName, itemContains: 'default-system' })
            cy.get('[data-cy="reseller-name"] input').type(resellerName)
            cy.get('[data-cy="aui-save-button"]').click()
            waitPageProgress()

            cy.contains('.q-notification', 'Reseller created successfully').should('be.visible')
            cy.locationShouldBe('#/reseller')
        })

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
                cy.get('[data-cy="superuser-flag"]').click()
            }

            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Administrator created successfully').should('be.visible')
        }

        it('Create an administrator and enable superuser for this administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            uiCreateAdmin({ name: admin1.name, pass: admin1.pass, resellerName: 'default', isSuperuser: true })
        })

        it('Create a second administrator with a different reseller', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            uiCreateAdmin({ name: admin2.name, pass: admin2.pass, resellerName, isSuperuser: false })
        })

        it('Log in and make sure that superuser admin can change permissions from admins with different resellers', () => {
            cy.login(admin1.name, admin1.pass)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin2.name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            cy.get('div[aria-disabled="true"]').should('not.exist') // TODO: it's not clear what was the DOM element to check
        })

        it('Set administrator to master', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin1.name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickToolbarActionButton('admin-edit')

            waitPageProgress()
            cy.get('[data-cy="superuser-flag"]').click()
            cy.get('[data-cy="master-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Administrator saved successfully').should('be.visible')
        })

        it('Log in and make sure that master admin cannot change permissions from admins with different resellers', () => {
            cy.login(admin1.name, admin1.pass)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin2.name)
            waitPageProgress()
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
        })

        it('Deactivate created administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin1.name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickToolbarActionButton('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="master-flag"]').click()
            cy.get('[data-cy="active-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Administrator saved successfully').should('be.visible')
        })

        it('Login with deactivated administrator', () => {
            cy.visit('/')
            // adding wait here, to be sure that inputs are intractable \ accessible
            cy.wait(500)

            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(admin1.name, admin1.pass, false)

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('[data-cy=aui-input-password] div[role="alert"]').should('be.visible')
            })
        })

        it('Enable customer care for administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin1.name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickToolbarActionButton('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="active-flag"]').click()
            cy.get('[data-cy="ccare-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Administrator saved successfully').should('be.visible')
        })

        it('Check if customer care has been activated', () => {
            cy.login(admin1.name, admin1.pass)
            cy.contains('Settings').click()
            cy.get('a[href="#/customer"]').should('be.visible')
            cy.get('a[href="#/subscriber"]').should('be.visible')
        })

        it('Enable read-only for administrator', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            cy.get('[data-cy="aui-input-search"] input').type(admin1.name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickToolbarActionButton('admin-edit')
            waitPageProgress()
            cy.get('[data-cy="ccare-flag"]').click()
            cy.get('[data-cy="readonly-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.contains('.q-notification', 'Administrator saved successfully').should('be.visible')
        })

        it('Check if read-only has been activated', () => {
            cy.login(admin1.name, admin1.pass)

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

        const deleteItemOnListPageByName = (name) => {
            cy.get('[data-cy="aui-input-search"] input').clear().type(name)
            waitPageProgress()
            cy.get('[data-cy=aui-data-table] .q-checkbox').click()
            clickToolbarActionButton('delete')
            cy.get('[data-cy="negative-confirmation-dialog"] [data-cy="btn-confirm"]').click()
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
        }

        it('Delete both administrators and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / admin-list')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageByName(admin1.name)
            deleteItemOnListPageByName(admin2.name)
        })

        it('Delete reseller and check if they are deleted', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / reseller-list')

            cy.locationShouldBe('#/reseller')
            deleteItemOnListPageByName(resellerName)
        })
    })
})
