/// <reference types="cypress" />

import {
    getRandomNum,
    clickDataTableSelectedMoreMenuItem,
    searchInDataTable,
    apiCreateAdmin,
    apiCreateSystemContact,
    apiCreateContract,
    apiCreateReseller,
    apiLoginAsSuperuser,
    apiRemoveAdminBy,
    apiRemoveSystemContactBy,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiCreateCustomer,
    apiCreateCustomerContact,
    apiCreateDomain,
    apiCreateSubscriber,
    apiRemoveSubscriberBy,
    apiRemoveDomainBy,
    apiRemoveCustomerBy,
    apiRemoveCustomerContactBy,
    apiCreateBillingProfile,
    apiRemoveBillingProfileBy,
    deleteItemOnListPageBy,
    waitPageProgressAUI
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const systemContact = {
    email: 'adminRolesSystemContact@example.com'
}

const admin = {
    role: 'admin',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'rolesAdmin@example.com',
    login: 'adminCypress',
    is_master: false,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const admin_system = {
    role: 'system',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'admin_system@example.com',
    login: 'adminSystemCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const admin_lawfulintercept = {
    role: 'lintercept',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'admin_lintercept@example.com',
    login: 'adminLinterceptCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const admin_master = {
    role: 'admin',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'admin_master@example.com',
    login: 'adminMasterCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const testadmin_otherreseller = {
    role: 'admin',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'testadmin_otherreseller@example.com',
    login: 'testadmin_otherreseller',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 0
}

const admin_reseller = {
    role: 'reseller',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'adminReseller@example.com',
    login: 'adminResellerCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const testadminreseller_otherreseller = {
    role: 'reseller',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'testadminreseller_otherreseller1@example.com',
    login: 'testadminreseller_othereseller1',
    is_master: false,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 0
}

const admin_ccare = {
    role: 'ccare',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'adminCCare@example.com',
    login: 'adminCCareCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 0
}

const admin_ccareadmin = {
    role: 'ccareadmin',
    password: 'Rand0m#PasswOrd#12345#',
    email: 'adminCCareAdminc@example.com',
    login: 'adminCCareAdmincCypress',
    is_master: true,
    read_only: false,
    is_active: true,
    show_passwords: true,
    call_data: true,
    can_reset_password: true,
    reseller_id: 1
}

const billingProfile = {
    name: 'adminRolesBillingProfile',
    handle: 'profilehandle1',
    reseller_id: 0
}


const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'adminRolesContract',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: "customer_adminroles",
    contact_id: 1,
    status: 'active',
    type: 'sipaccount',
}

const customer_reseller = {
    billing_profile_definition: 'id',
    billing_profile_id: 0,
    external_id: "customerReseller_adminroles",
    contact_id: 0,
    status: 'active',
    type: 'sipaccount',
}

const customerContact_reseller = {
    reseller_id: 0,
    email: 'customerContactRolesReseller@example.com',
}

const domain = {
    reseller_id: 1,
    domain: 'domainAdminRoles'
}

const domain_reseller = {
    reseller_id: 0,
    domain: 'domainResellerAdminRoles'
}

const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'adminRolesReseller',
    enable_rtc: false
}

const subscriber = {
    username: 'subscriberAdminRolesCypressAui',
    email: 'subscriberAdminRolesCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain_id: 0,
    customer_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: getRandomNum(4)
    },
}

const subscriber_reseller = {
    username: 'subscriberAdminRoleResellerCypressAui',
    email: 'subscriberAdminRoleResellerCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain_id: 0,
    customer_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: getRandomNum(4)
    },
}

context('Administrator roles tests', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            cy.log('Preparing environment...')
            apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader})
            apiRemoveSubscriberBy({ name: subscriber_reseller.external_id, authHeader})
            apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
            apiRemoveDomainBy({ name: 'testdomain', authHeader })
            apiRemoveDomainBy({ name: domain.domain, authHeader })
            apiRemoveDomainBy({ name: domain_reseller.domain, authHeader })
            apiRemoveCustomerBy({ name: customer.external_id, authHeader })
            apiRemoveCustomerBy({ name: customer_reseller.external_id, authHeader })
            apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
            apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            apiRemoveAdminBy({ name: admin_system.login, authHeader })
            apiRemoveAdminBy({ name: admin.login, authHeader })
            apiRemoveAdminBy({ name: admin_master.login, authHeader })
            apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
            apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
            apiRemoveAdminBy({ name: testadminreseller_otherreseller.login, authHeader })
            apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Data clean up pre-tests completed')

            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                    apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                        testadmin_otherreseller.reseller_id = id
                        testadminreseller_otherreseller.reseller_id = id
                        domain_reseller.reseller_id = id
                        customerContact_reseller.reseller_id = id
                        billingProfile.reseller_id = id
                        admin_ccare.reseller_id = id
                    })
                })
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveAdminBy({ name: admin.login, authHeader })
            apiRemoveAdminBy({ name: admin_master.login, authHeader })
            apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
            apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
            apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
    })

    context('Test admin and admin is_master roles', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Creating admin_master for tests...')
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
                apiCreateAdmin({ data: admin_master, authHeader })
            })
        })

        it('Create administrator', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
            })
            cy.quickLogin(admin_master.login, admin_master.password)
            cy.createAdminUI(admin)

            searchInDataTable(admin.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
            })
        })

        it('Create reseller administrator', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
            })
            cy.quickLogin(admin_master.login, admin_master.password)
            cy.createAdminUI(admin_reseller)

            searchInDataTable(admin_reseller.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin_reseller.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
            })
        })

        it('Create ccareadmin administrator', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            })
            cy.quickLogin(admin_master.login, admin_master.password)
            cy.createAdminUI(admin_ccareadmin)

            searchInDataTable(admin_ccareadmin.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin_ccareadmin.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            })
        })

        it('Create ccare administrator', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            })
            cy.quickLogin(admin_master.login, admin_master.password)
            cy.createAdminUI(admin_ccare)

            searchInDataTable(admin_ccare.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin_ccare.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            })
        })

        it('Check if is_master admin can edit an admin from a different reseller', () => {
            // Setup: Create testadmin_otherreseller
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
                apiCreateAdmin({ data: testadmin_otherreseller, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(testadmin_otherreseller.login)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')

            cy.get('div[data-cy="readonly-flag"]').click()

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()

            cy.get('td[data-cy="q-td--read-only"]').find('div[role="switch"][aria-checked="true"]').should('exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
            })
        })

        it('Edit ccareadmin admin to ccare admin', () => {
            // Setup: Create admin_ccareadmin
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
                apiCreateAdmin({ data: admin_ccareadmin, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin_ccareadmin.login)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')

            waitPageProgressAUI()
            cy.qSelect({ dataCy: 'roles-list', filter: 'ccare', itemContains: 'ccare -' })

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()

            cy.get('td[data-cy="q-td--role"]').contains('ccare').should('be.visible')
            cy.get('td[data-cy="q-td--role"]').contains('ccareadmin').should('not.exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            })
        })

        it('Make sure that admin user cannot edit an admin from a different reseller', () => {
            // Setup: Create both admin and testadmin_otherreseller
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
                apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
                apiCreateAdmin({ data: admin, authHeader })
                apiCreateAdmin({ data: testadmin_otherreseller, authHeader })
            })

            cy.quickLogin(admin.login, admin.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(testadmin_otherreseller.login)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
                apiRemoveAdminBy({ name: testadmin_otherreseller.login, authHeader })
            })
        })

        it('Delete admin', () => {
            // Setup: Create admin
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin.login, authHeader })
                apiCreateAdmin({ data: admin, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin.login)
        })

        it('Delete reseller admin', () => {
            // Setup: Create admin_reseller
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
                apiCreateAdmin({ data: admin_reseller, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin_reseller.login)
        })

        it('Delete ccare admin', () => {
            // Setup: Create admin_ccare
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
                apiCreateAdmin({ data: admin_ccare, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin_ccare.login)
        })

        it('Delete ccareadmin admin', () => {
            // Setup: Create admin_ccareadmin
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
                apiCreateAdmin({ data: admin_ccareadmin, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin_ccareadmin.login)
        })
    })

    context('Test system admin', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Creating admin_system for tests...')
                apiRemoveAdminBy({ name: admin_system.login, authHeader })
                apiCreateAdmin({ data: admin_system, authHeader })
            })
        })

        it('Check if system admin can create a master admin', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
            })
            cy.quickLogin(admin_system.login, admin_system.password)
            cy.createAdminUI(admin_master)

            searchInDataTable(admin_master.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin_master.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
            })
        })

        it('Check if system admin can create a lawful intercept admin', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            })
            cy.quickLogin(admin_system.login, admin_system.password)
            cy.createAdminUI(admin_lawfulintercept)

            searchInDataTable(admin_lawfulintercept.login)

            cy.get('td[data-cy="q-td--login"] span').contains(admin_lawfulintercept.login).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            })
        })

        it('Check if master admin cannot see lawful intercept admin', () => {
            // Setup: Create both admin_master and admin_lawfulintercept
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
                apiCreateAdmin({ data: admin_master, authHeader })
                apiCreateAdmin({ data: admin_lawfulintercept, authHeader })
            })

            cy.quickLogin(admin_master.login, admin_master.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin_lawfulintercept.login)

            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            })
        })

        it('Check if lawful intercept admin cannot see any other admins or pages', () => {
            // Setup: Create admin_lawfulintercept
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
                apiCreateAdmin({ data: admin_lawfulintercept, authHeader })
            })

            cy.quickLogin(admin_lawfulintercept.login, admin_lawfulintercept.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')

            cy.get('td[data-cy="q-td--email"] span').contains(admin_system.email).should('not.exist')
            cy.get('td[data-cy="q-td--email"] span').contains(admin.email).should('not.exist')

            cy.get('a[href="#/reseller"]').should('not.exist')
            cy.get('a[href="#/domain"]').should('not.exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            })
        })

        it('Edit lintercept admin to admin', () => {
            // Setup: Create admin_lawfulintercept
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
                apiCreateAdmin({ data: admin_lawfulintercept, authHeader })
            })

            cy.quickLogin(admin_system.login, admin_system.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            searchInDataTable(admin_lawfulintercept.login)
            cy.get('div[class="aui-data-table"] .q-checkbox').click()
            clickDataTableSelectedMoreMenuItem('adminEdit')

            waitPageProgressAUI()
            cy.qSelect({ dataCy: 'roles-list', filter: 'admin', itemContains: 'admin' })

            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('[data-cy="aui-close-button"]').click()

            cy.get('td[data-cy="q-td--role"]').contains('admin').should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
            })
        })

        it('Delete master admin', () => {
            // Setup: Create admin_master
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_master.login, authHeader })
                apiCreateAdmin({ data: admin_master, authHeader })
            })

            cy.quickLogin(admin_system.login, admin_system.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin_master.login)
        })

        it('Delete lawful intercept admin', () => {
            // Setup: Create admin_lawfulintercept
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_lawfulintercept.login, authHeader })
                apiCreateAdmin({ data: admin_lawfulintercept, authHeader })
            })

            cy.quickLogin(admin_system.login, admin_system.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            deleteItemOnListPageBy(admin_lawfulintercept.login)
        })
    })

    context('Test reseller admin', () => {
        it('Check if reseller admin cannot see data from other resellers and cannot see admin create button', () => {
            // Setup: Create necessary admins and data
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: testadminreseller_otherreseller.login, authHeader })
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })

                apiCreateAdmin({ data: admin_reseller, authHeader })
                apiCreateAdmin({ data: testadminreseller_otherreseller, authHeader })
                apiCreateCustomer({ data: customer, authHeader })
                apiCreateDomain({ data: domain, authHeader})
            })

            cy.quickLogin(testadminreseller_otherreseller.login, testadminreseller_otherreseller.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            cy.get('a[data-cy="aui-list-action--add"]').should('not.exist')
            searchInDataTable(admin_reseller.login)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            cy.navigateMainMenu('settings / customer')
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            cy.navigateMainMenu('settings / contact')
            cy.locationShouldBe('#/contact')
            searchInDataTable("default-customer@default.invalid")
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            cy.navigateMainMenu('settings / domain')
            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: testadminreseller_otherreseller.login, authHeader })
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Create a domain, check that reseller cannot be changed', () => {
            // Setup: Create testadminreseller_otherreseller
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: testadminreseller_otherreseller.login, authHeader })
                apiRemoveDomainBy({ name: 'testdomain', authHeader })
                apiCreateAdmin({ data: testadminreseller_otherreseller, authHeader })
            })

            cy.quickLogin(testadminreseller_otherreseller.login, testadminreseller_otherreseller.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('label[data-cy="aui-select-reseller"]').should('not.exist')
            cy.get('input[data-cy="domain-name"]').type('testdomain')
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            cy.get('td[data-cy="q-td--domain"]').contains('testdomain').should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: 'testdomain', authHeader })
                apiRemoveAdminBy({ name: testadminreseller_otherreseller.login, authHeader })
            })
        })

        it('Create an admin with is_master reseller admin', () => {
            // Setup: Create admin_reseller
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
                apiCreateAdmin({ data: admin_reseller, authHeader })
            })

            cy.quickLogin(admin_reseller.login, admin_reseller.password)
            cy.navigateMainMenu('settings / administrator')

            cy.locationShouldBe('#/administrator')
            cy.get('a[href="#/administrator/create"]').click()

            cy.locationShouldBe('#/administrator/create')
            cy.get('label[data-cy="aui-select-reseller"]').should('not.exist')
            cy.get('input[data-cy="login-field"] ').type(admin_ccare.login)
            cy.get('input[data-cy="password-field"] ').type(admin_ccare.password)
            cy.get('input[data-cy="password-retype-field"] ').type(admin_ccare.password)
            cy.get('label[data-cy="roles-list"]').should('not.exist')
            cy.get('div[data-cy="master-flag"]').click()
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
                apiRemoveAdminBy({ name: admin_reseller.login, authHeader })
            })
        })
    })

    context('Test ccareadmin admin', () => {
        it('Check if ccareadmin admin can only see customer and subscriber menus, also access blocked site via customer creation page', () => {
            // Setup: Create all needed data
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
                apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader})
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })

                apiCreateAdmin({ data: admin_ccareadmin, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                    apiCreateDomain({ data: domain, authHeader}).then(({ id }) => {
                        apiCreateSubscriber({ data: { ...subscriber, domain_id: id }, authHeader })
                    })
                })
            })

            cy.quickLogin(admin_ccareadmin.login, admin_ccareadmin.password)
            cy.navigateMainMenu('settings / customer')
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer.external_id, 'External #')
            cy.get('td[data-cy="q-td--external-id"]').contains(customer.external_id).should('be.visible')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('button[data-cy="aui-create-button"]:first').click()
            cy.locationShouldBe('#/error403')
            cy.get('a[href="#/dashboard"]').click()

            cy.navigateMainMenu('settings / subscriber')
            cy.locationShouldBe('#/subscriber')
            searchInDataTable(subscriber.username)
            cy.get('td[data-cy="q-td--username"]').contains(subscriber.username).should('be.visible')

            cy.get('a[href="#/administrator"]').should('not.exist')
            cy.get('a[href="#/reseller"]').should('not.exist')
            cy.get('a[href="#/domain"]').should('not.exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader})
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            })
        })

        it('Create a customer with existing billing profile and contact', () => {
            // Setup: Create admin_ccareadmin
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
                apiCreateAdmin({ data: admin_ccareadmin, authHeader })
            })

            cy.quickLogin(admin_ccareadmin.login, admin_ccareadmin.password)
            cy.navigateMainMenu('settings / customer')

            cy.locationShouldBe('#/customer')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: 'default-customer@default.invalid', itemContains: 'default-customer@default.invalid' })
            cy.get('input[data-cy="customer-external-id"]').type(customer.external_id)
            cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: 'Default Billing Profile', itemContains: 'Default Billing Profile' })
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            searchInDataTable(customer.external_id, 'External #')
            cy.get('td[data-cy="q-td--external-id"]').contains(customer.external_id).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveAdminBy({ name: admin_ccareadmin.login, authHeader })
            })
        })
    })

    context('Test ccare admin', () => {
        it('Check if ccare admin can only see customer and subscriber menus, also access blocked site via customer creation page', () => {
            // Setup: Create all needed data
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber_reseller.external_id, authHeader})
                apiRemoveDomainBy({ name: domain_reseller.domain, authHeader })
                apiRemoveCustomerBy({ name: customer_reseller.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })

                apiCreateAdmin({ data: admin_ccare, authHeader })
                apiCreateCustomerContact({ data: customerContact_reseller, authHeader }).then(({ id }) => {
                    let contactid = id
                    apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                        customer_reseller.billing_profile_id = id
                        apiCreateCustomer({ data: { ...customer_reseller, contact_id: contactid }, authHeader }).then(({ id }) => {
                            subscriber_reseller.customer_id = id
                            apiCreateDomain({ data: domain_reseller, authHeader}).then(({ id }) => {
                                apiCreateSubscriber({ data: { ...subscriber_reseller, domain_id: id }, authHeader })
                            })
                        })
                    })
                })
            })

            cy.quickLogin(admin_ccare.login, admin_ccare.password)
            cy.navigateMainMenu('settings / customer')
            cy.locationShouldBe('#/customer')
            searchInDataTable(customer_reseller.external_id, 'External #')
            cy.get('td[data-cy="q-td--external-id"]').contains(customer_reseller.external_id).should('be.visible')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('button[data-cy="aui-create-button"]:first').click()
            cy.locationShouldBe('#/error403')
            cy.get('a[href="#/dashboard"]').click()

            cy.navigateMainMenu('settings / subscriber')
            cy.locationShouldBe('#/subscriber')
            searchInDataTable(subscriber_reseller.username)
            cy.get('td[data-cy="q-td--username"]').contains(subscriber_reseller.username).should('be.visible')

            cy.get('a[href="#/administrator"]').should('not.exist')
            cy.get('a[href="#/reseller"]').should('not.exist')
            cy.get('a[href="#/domain"]').should('not.exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber_reseller.external_id, authHeader})
                apiRemoveDomainBy({ name: domain_reseller.domain, authHeader })
                apiRemoveCustomerBy({ name: customer_reseller.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            })
        })

        it('Check if ccare admin can only see customer and subscriber with same reseller', () => {
            // Setup: Create all needed data for both resellers
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader})
                apiRemoveSubscriberBy({ name: subscriber_reseller.external_id, authHeader})
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveDomainBy({ name: domain_reseller.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerBy({ name: customer_reseller.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })

                apiCreateAdmin({ data: admin_ccare, authHeader })
                apiCreateCustomer({ data: customer, authHeader }).then(({ id }) => {
                    subscriber.customer_id = id
                    apiCreateDomain({ data: domain, authHeader}).then(({ id }) => {
                        apiCreateSubscriber({ data: { ...subscriber, domain_id: id }, authHeader })
                    })
                })
                apiCreateCustomerContact({ data: customerContact_reseller, authHeader }).then(({ id }) => {
                    let contactid = id
                    apiCreateBillingProfile({ data: billingProfile, authHeader }).then(({ id }) => {
                        customer_reseller.billing_profile_id = id
                        apiCreateCustomer({ data: { ...customer_reseller, contact_id: contactid }, authHeader }).then(({ id }) => {
                            subscriber_reseller.customer_id = id
                            apiCreateDomain({ data: domain_reseller, authHeader}).then(({ id }) => {
                                apiCreateSubscriber({ data: { ...subscriber_reseller, domain_id: id }, authHeader })
                            })
                        })
                    })
                })
            })

            cy.quickLogin(admin_ccare.login, admin_ccare.password)
            cy.navigateMainMenu('settings / customer')
            cy.locationShouldBe('#/customer')

            cy.get('td[data-cy="q-td--external-id"]').contains(customer_reseller.external_id).should('be.visible')
            cy.get('td[data-cy="q-td--external-id"]').contains(customer.external_id).should('not.exist')
            cy.navigateMainMenu('subscriber')
            cy.locationShouldBe('#/subscriber')

            cy.get('td[data-cy="q-td--username"]').contains(subscriber_reseller.username).should('be.visible')
            cy.get('td[data-cy="q-td--username"]').contains(subscriber.username).should('not.exist')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSubscriberBy({ name: subscriber.external_id, authHeader})
                apiRemoveSubscriberBy({ name: subscriber_reseller.external_id, authHeader})
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveDomainBy({ name: domain_reseller.domain, authHeader })
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerBy({ name: customer_reseller.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            })
        })

        it('Create a customer, check if reseller cannot be changed', () => {
            // Setup: Create all needed data
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })

                apiCreateAdmin({ data: admin_ccare, authHeader })
                apiCreateCustomerContact({ data: customerContact_reseller, authHeader })
                apiCreateBillingProfile({ data: billingProfile, authHeader })
            })

            cy.quickLogin(admin_ccare.login, admin_ccare.password)
            cy.navigateMainMenu('settings / customer')

            cy.locationShouldBe('#/customer')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('label[data-cy="aui-select-contact"]').click()
            cy.get('div[data-cy="q-item-label"]').contains(customerContact_reseller.email).should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('#1 - default-customer@default.invalid').should('not.exist')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-billing-profile', filter: billingProfile.name, itemContains: billingProfile.name })
            cy.get('label[data-cy="aui-select-billing-profile"]').click()
            cy.get('div[data-cy="q-item-label"]').contains(billingProfile.name).should('be.visible')
            cy.get('div[data-cy="q-item-label"]').contains('Default Billing Profile').should('not.exist')
            cy.auiSelectLazySelect({ dataCy: 'aui-select-contact', filter: customerContact_reseller.email, itemContains: customerContact_reseller.email })
            cy.get('input[data-cy="customer-external-id"]').type(customer.external_id)
            cy.get('[data-cy="aui-save-button"]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')

            searchInDataTable(customer.external_id, 'External #')
            cy.get('td[data-cy="q-td--external-id"]').contains(customer.external_id).should('be.visible')
            cy.get('td[data-cy="q-td--contact-email"]').contains(customerContact_reseller.email).should('be.visible')
            cy.get('td[data-cy="q-td--billing-profile-name"]').contains(billingProfile.name).should('be.visible')

            // Clean up
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerBy({ name: customer.external_id, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact_reseller.email, authHeader })
                apiRemoveBillingProfileBy({ name: billingProfile.name, authHeader })
                apiRemoveAdminBy({ name: admin_ccare.login, authHeader })
            })
        })
    })
})
