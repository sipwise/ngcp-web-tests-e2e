/// <reference types="cypress" />
import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    waitPageProgress,
    apiCreateEmailTemplate,
    apiRemoveEmailTemplateBy,
    searchInDataTable,
    deleteItemOnListPageBy
} from '../../../support/ngcp-aui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractEmailTemplate',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerEmailTemplate',
    enable_rtc: false
}

export const emailTemplate = {
    attachment_name: "attach",
    subject: "testmail",
    from_email: "test.test@test.com",
    name: "emailTemplateCypress",
    body: "testbody",
    reseller_id: 0
}

const systemContactDependency = {
    email: 'systemEmailTemplate@example.com'
}

context('Email template tests', () => {
    context('UI email template tests', () => {
        before(() => {
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            apiCreateEmailTemplate({ data: { ...emailTemplate, reseller_id: id }, authHeader })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {

            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveEmailTemplateBy({ name: emailTemplate.name, authHeader })
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })

        it('Check if email template with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / emailtemplate')
            waitPageProgress()
            cy.locationShouldBe('#/emailtemplate/custom')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('label[data-cy="emailtemplates-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="emailtemplates-subject"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="emailtemplates-from-email"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="emailtemplates-body"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('input[data-cy="emailtemplates-from-email"]').type('testing')
            cy.get('label[data-cy="emailtemplates-from-email"]').find('div[role="alert"]').contains('Input must be a valid email address').should('be.visible')
        })

        it('Create a email template', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveEmailTemplateBy({ name: emailTemplate.name, authHeader })
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / emailtemplate')
            waitPageProgress()
            cy.locationShouldBe('#/emailtemplate/custom')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="emailtemplates-name"]').type(emailTemplate.name)
            cy.get('input[data-cy="emailtemplates-subject"]').type(emailTemplate.subject)
            cy.get('input[data-cy="emailtemplates-from-email"]').type(emailTemplate.from_email)
            cy.get('textarea[data-cy="emailtemplates-body"]').type(emailTemplate.body)
            cy.get('[data-cy=aui-save-button]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            searchInDataTable(emailTemplate.name, 'Name')
            cy.get('td[data-cy="q-td--name"]').contains(emailTemplate.name).should('be.visible')
            cy.get('td[data-cy="q-td--from-email"]').contains(emailTemplate.from_email).should('be.visible')
            cy.get('td[data-cy="q-td--subject"]').contains(emailTemplate.subject).should('be.visible')
        })

        it('Edit a email template', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / emailtemplate')
            waitPageProgress()
            cy.locationShouldBe('#/emailtemplate/custom')
            searchInDataTable(emailTemplate.name, 'Name')
            cy.get('td[data-cy="q-td--more-menu-left"]').click()
            cy.get('a[data-cy="aui-data-table-row-menu--emailTemplateEditCustom"]').click()
            cy.get('input[data-cy="emailtemplates-subject"]').clear().type("testsubject")
            cy.get('[data-cy=aui-save-button]').click()
            waitPageProgress()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('button[data-cy="aui-close-button"]').click()
            cy.get('td[data-cy="q-td--subject"]').contains('testsubject').should('be.visible')
        })

        it('Delete email template', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / emailtemplate')
            waitPageProgress()
            cy.locationShouldBe('#/emailtemplate/custom')
            deleteItemOnListPageBy(emailTemplate.name, 'Name')
        })
    })
})
