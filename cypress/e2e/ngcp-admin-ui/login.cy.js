/// <reference types="cypress" />

import {
    apiCreateAdmin,
    apiCreateContract,
    apiCreateSystemContact,
    apiCreateReseller,
    apiGetMail,
    apiGetMailboxLastItem,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    getRandomNum
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

function checkLoginAPIResponse (response) {
    expect(response.status || response.statusCode).to.equal(200)
    expect(response.body).to.have.property('jwt')
}

function CheckLoggedInUI () {
    cy.get('.q-drawer').should('to.be.visible')
    cy.url().should('match', /\/#\/dashboard/)
}

const admin = {
    role: 'admin',
    password: 'rand0mpassword12345',
    newpassword: 'n3wpassword12345',
    login: 'admin' + getRandomNum(),
    email: 'user' + getRandomNum() + '@example.com',
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

const urlRegex = /(https?:\/\/[^ ]*)/

context('Login page tests', () => {
    context('API direct login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        })

        it('Testing "cy.loginAPI" command (valid user)', () => {
            // requesting API for JWT token, before we actually load our application UI
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginAPI(ngcpConfig.username, ngcpConfig.password).then(({ response }) => {
                checkLoginAPIResponse(response)
            })

            // we should open our application to "see" that stored JWT applied successfully
            cy.visit('/')
            CheckLoggedInUI()
        })

        it('Testing "cy.loginAPI" command (invalid user)', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginAPI('invalid-user', 'invalid-password').then(({ response }) => {
                expect(response.status || response.statusCode).to.not.equal(200)
            })
        })
    })

    context('UI login tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: contact, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            apiCreateAdmin({ data: { ...admin, reseller_id: id }, authHeader })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            if (Cypress.currentTest.title == 'Check if unknown URL will route to login page') {
                cy.log('Skip beforeEach visit for this test to prevent freezing')
            } else {
                cy.visit('/')
                // adding wait here, to be sure that inputs are intractable \ accessible
                cy.wait(500)
            }
        })

        after(() => {
            // let's remove all data via API
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: contact.email, authHeader })
            })
        })

        it('Check if using "/" will route to login page', () => {
            cy.logout()
            cy.visit('/')
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it('Check if unknown URL will route to login page', () => {
            cy.visit('/#/some-other-page')
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it('Login through UI with no credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect user and password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type('not-exists-user')
            cy.get('input:last').type('not-exists-password')
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with incorrect password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type('not-exists-password')
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(403)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with no password', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').clear()
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                expect(response.statusCode).to.equal(422)
                cy.get('.q-field div[role="alert"]').should('be.visible')
            })
        })

        it('Login through UI with correct credentials', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.get('input:first').type(ngcpConfig.username)
            cy.get('input:last').type(ngcpConfig.password)
            cy.get('[data-cy=sign-in]').click()

            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
            })
            CheckLoggedInUI()
        })

        it('Test helper functions cy.loginUi / cy.logoutUI', () => {
            cy.intercept('POST', '**/login_jwt').as('loginRequest')
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@loginRequest').then(({ response }) => {
                checkLoginAPIResponse(response)
                CheckLoggedInUI()
            })
            cy.logoutUI()
            cy.url().should('match', /\/#\/login\/admin/)
        })

        it.skip('Try to send a password reset email', () => {
            // cy.logout() // TODO: we need rework loginAPI to be able to cleanup localStorage OR create logoutAPI \ loginCleanup etc
            cy.get('[data-cy="reset-password"]').click()
            cy.get('label[data-cy="input-username"]').type(admin.login)
            cy.get('[data-cy="button-send"]').click()
            cy.get('.q-notification[role="alert"]').should('have.class', 'bg-positive')
            cy.waitUntil(
                () => apiGetMailboxLastItem({
                    mailboxName: admin.email,
                    filterSubject: 'Password reset'
                }).then(lastMailInfo => {
                    if (!lastMailInfo?.id) {
                        return false
                    } else {
                        apiGetMail({
                            mailboxName: admin.email,
                            id: lastMailInfo.id
                        }).then(response => {
                            const responseCheck = String(response).match(urlRegex)
                            if (responseCheck) {
                                const resetPasswordURL = responseCheck?.[1]
                                return resetPasswordURL
                            } else {
                                return false
                            }
                        })
                    }
                }),
                {
                    customMessage: 'Waiting for email',
                    errorMsg: 'Unable to find an email with the reset password URL',
                    interval: 1000
                }
                /* NOTE: you the test is failing on this step, please check that your NGCP platform is configured properly
                    ngcpcfg set /etc/ngcp-config/config.yml email.hostname=dev-web-trunk.mgm.sipwise.com ## domain name of your NGCP server
                    ngcpcfg set /etc/ngcp-config/config.yml email.smarthosts.0.hostname=autoprov.lab.sipwise.com
                    ngcpcfg set /etc/ngcp-config/config.yml email.smarthosts.0.port=2525
                    ngcpcfg apply "enable test email delivery to autoprov.lab.sipwise.com"
                 */
            ).then(resetPasswordURL => {
                cy.visit(resetPasswordURL)
                // adding wait here, to be sure that inputs are intractable \ accessible
                cy.wait(500)
                cy.get('input[data-cy="password-input"]').type(admin.newpassword)
                cy.get('input[data-cy="password-retype-input"]').type(admin.newpassword)
                cy.get('button[data-cy="save-button"]').click()
                cy.url().should('match', /\/#\/login\/admin/)
                cy.get('input:first').type(admin.login)
                cy.get('input:last').type(admin.newpassword)
                cy.get('[data-cy=sign-in]').click()
                CheckLoggedInUI()
            })
        })
    })

    context('i18n tests', () => {
        beforeEach(() => {
            cy.visit('/')
            // adding wait here, to be sure that inputs are intractable \ accessible
            cy.wait(500)
        })

        it('Check if login page is available in all different languages', () => {
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Deutsch').click()
            cy.contains('[id="login-title"]', 'Administrator-Anmeldung').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Español').click()
            cy.contains('[id="login-title"]', 'Inicio de Sesión de Administrador').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Français').click()
            cy.contains('[id="login-title"]', 'Connexion Admin').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('Italiano').click()
            cy.contains('[id="login-title"]', 'Admin Sign In').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('English').click()
            cy.contains('[id="login-title"]', 'Admin Sign In').should('be.visible')
        })

        it('Check if main page is available in all different languges', () => {
            cy.loginUI(ngcpConfig.username, ngcpConfig.password)
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[role="listitem"]', 'Deutsch').click()
            cy.contains('a[href="#/dashboard"]', 'Übersicht').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[role="listitem"]', 'Español').click()
            cy.contains('a[href="#/dashboard"]', 'Tablero').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[role="listitem"]', 'Français').click()
            cy.contains('a[href="#/dashboard"]', 'Tableau de bord').should('be.visible')
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[role="listitem"]', 'Italiano').click()
            cy.contains('a[href="#/dashboard"]', 'Dashboard').should('be.visible')// TODO: update when italian translation is available
            cy.get('[data-cy="aui-selection-language"]').click()
            cy.contains('div[role="listitem"]', 'English').click()
            cy.contains('a[href="#/dashboard"]', 'Dashboard').should('be.visible')
        })
    })
})
