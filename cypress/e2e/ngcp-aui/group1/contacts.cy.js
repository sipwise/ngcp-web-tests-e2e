/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    clickDataTableSelectedMoreMenuItem,
    searchInDataTable,
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateCustomerContact,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveCustomerContactBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const contactNames = {
    firstname: 'first' + getRandomNum(),
    lastname: 'last' + getRandomNum()
}
export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'testContacts',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const customerContact = {
    reseller_id: null,
    email: 'testContacts@example.com'
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerContactsCypress',
    enable_rtc: false
}

const systemContact = {
    email: 'systemTestContact@example.com'
}

const systemContactDependency = {
    email: 'systemDependContacts@example.com'
}

context('Contact tests', () => {
    context('UI contact tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            customerContact.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                cy.log('Cleaning up db...')
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })

                cy.log('Seeding db...')
                apiCreateSystemContact({ data: systemContact, authHeader })
                apiCreateCustomerContact({ data: customerContact, authHeader })
            })
        })
        
        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })


        ;[
            { type: 'customer', checkUrl: '#/contact/create' },
            { type: 'system', checkUrl: '#/contact/create/noreseller' }
        ].forEach(testsGroup => {
            const contactType = testsGroup.type
            const formUrl = testsGroup.checkUrl

            context(`Contact type: ${contactType}`, () => {
                it(`Check if ${contactType} contact with invalid values gets rejected`, () => {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact')

                    cy.locationShouldBe('#/contact')
                    cy.get('button[data-cy="aui-list-action--add"]').click()
                    cy.get('a[href="' + formUrl + '"]').click()

                    cy.locationShouldBe(formUrl)
                    cy.get('[data-cy="aui-save-button"]').click()
                    if (contactType === 'customer') {
                        cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    } else {
                        cy.get('input[data-cy="aui-select-reseller"]').should('not.exist')
                    }
                    cy.get('input[data-cy="email-field"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    cy.get('input[data-cy="email-field"]').type('invaildmail')
                    cy.get('[data-cy="aui-save-button"]').click()
                    if (contactType === 'customer') {
                        cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                    } else {
                        cy.get('input[data-cy="aui-select-reseller"]').should('not.exist')
                    }
                    cy.get('input[data-cy="email-field"]').parents('label').find('div[role="alert"]').contains('Input must be a valid email address').should('be.visible')
                })

                it(`Create a ${contactType} contact`, () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveCustomerContactBy({ email: customerContact.email, authHeader })
                        apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                    })
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact')

                    cy.locationShouldBe('#/contact')
                    cy.get('button[data-cy="aui-list-action--add"]').click()
                    cy.get('a[href="' + formUrl + '"]').click()

                    cy.locationShouldBe(formUrl)
                    if (contactType === 'customer') {
                        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
                        cy.get('input[data-cy="email-field"]').type(customerContact.email)
                    } else {
                        cy.get('[data-cy="aui-select-reseller"]').should('not.exist')
                        cy.get('input[data-cy="email-field"]').type(systemContact.email)
                    }

                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Add First and last name to ${contactType} contact`, () => {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact')

                    cy.locationShouldBe('#/contact')

                    if (contactType === 'customer') {
                        searchInDataTable(customerContact.email)
                    } else {
                        searchInDataTable(systemContact.email)
                    }
                    cy.get('div[class="aui-data-table"] .q-checkbox').click()
                    clickDataTableSelectedMoreMenuItem('contactEdit')

                    // cy.locationShouldBe(formUrl) // TODO: parametric URLs
                    cy.get('input[data-cy="firstname-field"]').type(contactNames.firstname)
                    cy.get('input[data-cy="lastname-field"]').type(contactNames.lastname)
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgressAUI()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('[data-cy="aui-close-button"]').click()
                    waitPageProgressAUI()
                    cy.get('td[data-cy="q-td--firstname"]').contains(contactNames.firstname).should('be.visible')
                    cy.get('td[data-cy="q-td--lastname"]').contains(contactNames.lastname).should('be.visible')
                })

                it(`Delete ${contactType} contact`, () => {
                    cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact')

                    cy.locationShouldBe('#/contact')
                    if (contactType === 'customer') {
                        deleteItemOnListPageBy(customerContact.email)
                    } else {
                        deleteItemOnListPageBy(systemContact.email)
                    }
                })
            })
        })
    })
})
