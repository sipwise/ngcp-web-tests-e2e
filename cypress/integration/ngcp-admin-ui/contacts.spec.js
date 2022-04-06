/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarDropdownActionButton,
    deleteItemOnListPageByName,
    clickDataTableSelectedMoreMenuItem, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateCustomerContact,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveCustomerContactBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy
} from '../../support/ngcp-admin-ui/utils/api'

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
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    cy.get('div[label="Add"]').click() // TODO: fix issues in data-cy
                    clickToolbarDropdownActionButton(`contact-create-${contactType}`)

                    cy.locationShouldBe(formUrl)
                    cy.get('[data-cy="aui-save-button"]').click()
                    if (contactType === 'customer') {
                        cy.get('label[data-cy="aui-select-reseller"][error="true"]').should('be.visible')
                    } else {
                        cy.get('label[data-cy="aui-select-reseller"]').should('not.exist')
                    }
                    cy.get('label[data-cy="email-field"] div[role="alert"]').should('be.visible')
                    cy.get('input[data-cy="email-field"]').type('invaildmail')
                    cy.get('[data-cy="aui-save-button"]').click()
                    if (contactType === 'customer') {
                        cy.get('label[data-cy="aui-select-reseller"][error="true"]').should('be.visible')
                    } else {
                        cy.get('label[data-cy="aui-select-reseller"]').should('not.exist')
                    }
                    cy.get('label[data-cy="email-field"] div[role="alert"]').should('be.visible')
                })

                it(`Create a ${contactType} contact`, () => {
                    apiLoginAsSuperuser().then(authHeader => {
                        apiRemoveSystemContactBy({ name: systemContact.email, authHeader })
                        apiRemoveCustomerContactBy({ name: customerContact.email, authHeader })
                    })
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    cy.get('[data-cy="aui-list-action"]').click()
                    clickToolbarDropdownActionButton(`contact-create-${contactType}`)

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
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')

                    if (contactType === 'customer') {
                        searchInDataTable(customerContact.email)
                    } else {
                        searchInDataTable(systemContact.email)
                    }
                    cy.get('[data-cy=aui-data-table] .q-checkbox').click()
                    clickDataTableSelectedMoreMenuItem('contact-edit')

                    // cy.locationShouldBe(formUrl) // TODO: parametric URLs
                    cy.get('input[data-cy="firstname-field"]').type(contactNames.firstname)
                    cy.get('input[data-cy="lastname-field"]').type(contactNames.lastname)
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgress()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Delete ${contactType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    if (contactType === 'customer') {
                        deleteItemOnListPageByName(customerContact.email)
                    } else {
                        deleteItemOnListPageByName(systemContact.email)
                    }
                })
            })
        })
    })
})
