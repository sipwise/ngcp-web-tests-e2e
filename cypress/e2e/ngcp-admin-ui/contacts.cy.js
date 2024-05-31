/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
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
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

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

const customerContact = {
    reseller_id: null,
    email: 'contact' + getRandomNum() + '@example.com'
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const systemContactDependency = {
    email: 'contact' + getRandomNum() + '@example.com'
}

const contactNames = {
    firstname: 'first' + getRandomNum(),
    lastname: 'last' + getRandomNum()
}

context('Contact tests', () => {
    context('UI contact tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
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
                apiCreateSystemContact({ data: systemContact, authHeader })
                apiCreateCustomerContact({ data: customerContact, authHeader })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
                apiRemoveCustomerContactBy({ name: customerContact.email, authHeader })
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
                    cy.login(ngcpConfig.username, ngcpConfig.password)
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
                        apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
                        apiRemoveCustomerContactBy({ name: customerContact.email, authHeader })
                    })
                    cy.login(ngcpConfig.username, ngcpConfig.password)
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
                    cy.login(ngcpConfig.username, ngcpConfig.password)
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
                    waitPageProgress()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                    cy.get('[data-cy="aui-close-button"]').click()
                    waitPageProgress()
                    cy.get('td[data-cy="q-td--firstname"]').contains(contactNames.firstname).should('be.visible')
                    cy.get('td[data-cy="q-td--lastname"]').contains(contactNames.lastname).should('be.visible')
                })

                it(`Delete ${contactType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
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
