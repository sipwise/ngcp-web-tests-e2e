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
    apiCreateContact,
    apiCreateContract,
    apiGetContactId,
    apiGetContractId,
    apiCreateReseller,
    apiRemoveResellerBy,
    apiRemoveContractBy,
    apiRemoveContactBy
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
    email: 'user' + getRandomNum() + '@example.com'
}

const contact = {
    mail: 'contact' + getRandomNum() + '@example.com',
    firstname: 'first' + getRandomNum(),
    lastname: 'last' + getRandomNum()
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

context('Contact tests', () => {
    context('UI contact tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateContact({ data: systemContact, authHeader })
                apiGetContactId({ name: systemContact.email, authHeader }).then(contactId => {
                    return apiCreateContract({ data: { ...contract, contact_id: contactId }, authHeader })
                })
                apiGetContractId({ name: contract.external_id, authHeader }).then(contractId => {
                    reseller.contract_id = contractId
                    return apiCreateReseller({ data: reseller, authHeader })
                })
            })
        })
        // TODO: fix API seeding issues
        // before(() => {
        //     // let's create data required for the tests below
        //     cy.log('Create a reseller')
        //     apiLoginAsSuperuser().then(authHeader => {
        //         const contractData = {
        //             ...defaultResellerContractCreationData,
        //             status: 'pending'
        //         }
        //         apiCreateContract({ data: contractData, authHeader })
        //             .then(contractResponse => {
        //                 console.log('data:', contractResponse)
        //                 if (contractResponse?.id) {
        //                     const resellerData = {
        //                         ...defaultResellerCreationData,
        //                         name: resellerName,
        //                         contract_id: contractResponse?.id,
        //                         enable_rtc: true
        //                     }
        //                     apiCreateReseller({ data: resellerData, authHeader })
        //                 }
        //             })
        //     })
        // })

        after(() => {
            // let's remove all data via API at the end of all tests
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveContactBy({ name: systemContact.email, authHeader })
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
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    cy.get('[data-cy="aui-list-action"]').click()
                    clickToolbarDropdownActionButton(`contact-create-${contactType}`)

                    cy.locationShouldBe(formUrl)
                    if (contactType === 'customer') {
                        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
                    } else {
                        cy.get('[data-cy="aui-select-reseller"]').should('not.exist')
                    }

                    cy.get('input[data-cy="email-field"]').type(contact.mail)
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Add First and last name to ${contactType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')

                    searchInDataTable(contact.mail)
                    cy.get('[data-cy=aui-data-table] .q-checkbox').click()
                    clickDataTableSelectedMoreMenuItem('contact-edit')

                    // cy.locationShouldBe(formUrl) // TODO: parametric URLs
                    cy.get('input[data-cy="firstname-field"]').type(contact.firstname)
                    cy.get('input[data-cy="lastname-field"]').type(contact.lastname)
                    cy.get('[data-cy="aui-save-button"]').click()
                    waitPageProgress()
                    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
                })

                it(`Delete ${contactType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    deleteItemOnListPageByName(contact.mail)
                })
            })
        })

        context('finalization', () => {
            it('Data cleanup', () => {
                // placeholder test for the "after" hook
            })
        })
    })
})
