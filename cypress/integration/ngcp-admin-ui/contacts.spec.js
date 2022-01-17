/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickToolbarActionButton,
    clickToolbarDropdownActionButton,
    deleteItemOnListPageByName,
    clickDataTableSelectedMoreMenuItem, searchInDataTable
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateContract,
    apiCreateReseller,
    apiLoginAsSuperuser,
    apiRemoveResellerBy,
    defaultResellerContractCreationData,
    defaultResellerCreationData
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')

const resellerName = 'reseller' + getRandomNum()
const contractName = 'contract' + getRandomNum()

const contact = {
    mail: 'contact' + getRandomNum() + '@example.com',
    firstname: 'first' + getRandomNum(),
    lastname: 'last' + getRandomNum()
}

context('Contact tests', () => {
    context('UI contact tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
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
                apiRemoveResellerBy({ name: resellerName, authHeader })
            })
        })

        context('initialization', () => {
            it.skip('Data seeding', () => {
                // placeholder test for the "before" hook
            })

            it('Create a reseller', () => {
                cy.login(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / reseller-list')

                cy.locationShouldBe('#/reseller')
                clickToolbarActionButton('reseller-creation')

                cy.locationShouldBe('#/reseller/create')
                cy.get('[data-cy=aui-select-contract] [data-cy=aui-create-button]').click()

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
                    cy.contains('div[role="alert"]', 'Input is required').should('be.visible')
                    cy.get('input[data-cy="email-field"]').type('invaildmail')
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('div[role="alert"]', 'Input must be a valid email address').should('be.visible')
                })

                it(`Create a ${contactType} contact`, () => {
                    cy.login(ngcpConfig.username, ngcpConfig.password)
                    cy.navigateMainMenu('settings / contact-list')

                    cy.locationShouldBe('#/contact')
                    cy.get('div[label="Add"]').click() // TODO: fix issues in data-cy
                    clickToolbarDropdownActionButton(`contact-create-${contactType}`)

                    cy.locationShouldBe(formUrl)
                    if (contactType === 'customer') {
                        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: resellerName, itemContains: resellerName })
                    } else {
                        cy.get('[data-cy="aui-select-reseller"]').should('not.exist')
                    }

                    cy.get('input[data-cy="email-field"]').type(contact.mail)
                    cy.get('[data-cy="aui-save-button"]').click()
                    cy.contains('.q-notification', 'Contact created successfully').should('be.visible')
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
                    cy.contains('.q-notification', 'Contract saved successfully').should('be.visible')
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
