/// <reference types="cypress" />
//TODO: add timeset events when timeset events page gets ported
import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateResellerPhonebook,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveResellerPhonebookBy,
    apiRemoveSystemContactBy,
    deleteDownloadsFolder,
    getRandomNum,
    waitPageProgress
} from '../../support/ngcp-admin-ui/e2e'

const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')
const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

const contract = {
    contact_id: 3,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
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

const ResellerPhonebook = {
    name: 'phonebook' + getRandomNum(),
    reseller_id: 0,
    number: getRandomNum()
}

context('Phonebook tests', () => {
    context('UI phonebook tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...contract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                            ResellerPhonebook.reseller_id = id
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateResellerPhonebook({data: ResellerPhonebook, authHeader})
            })
        })

        after(() => {
            cy.log('Data clean up...')
            deleteDownloadsFolder()
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerBy({ name: reseller.name, authHeader })
                apiRemoveContractBy({ name: contract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerPhonebookBy({name: ResellerPhonebook.name, authHeader})
            })
        })

        it('Check if phonebook with invalid values gets rejected', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / phonebook')
            waitPageProgress()
            cy.locationShouldBe('#/phonebook')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="phonebook-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            cy.get('label[data-cy="phonebook-number"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        })

        it('Create a phonebook', () => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerPhonebookBy({name: ResellerPhonebook.name, authHeader})
            })
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / phonebook')
            waitPageProgress()
            cy.locationShouldBe('#/phonebook')
            cy.get('a[data-cy="aui-list-action--add"]').click()
            cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
            cy.get('input[data-cy="phonebook-name"]').type(ResellerPhonebook.name)
            cy.get('input[data-cy="phonebook-number"]').type(ResellerPhonebook.number)
            cy.get('[data-cy=aui-save-button]').click()
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        })

        it('Download a phonebook CSV', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / phonebook')
            waitPageProgress()
            cy.locationShouldBe('#/phonebook')
            cy.get('button[data-cy="phonebook-download-csv"]').click()
            const filename = path.join(downloadsFolder, 'reseller_phonebook_entries.csv')
            cy.readFile(filename, 'binary', { timeout: 1000 })
                .should(buffer => expect(buffer.length).to.be.gt(20))
        })

        it('Upload a phonebook CSV', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / phonebook')
            waitPageProgress()
            cy.locationShouldBe('#/phonebook')
            cy.get('a[data-cy="phonebook-upload-csv"]').click()
            cy.get('input[type="file"][data-cy="phonebook-upload-field"]').selectFile(path.join(fixturesFolder, 'reseller_phonebook_entries.csv'), { force: 'true' })
            cy.get('div[data-cy="phonebook-purge"]').click()
            cy.get('button[data-cy="aui-save-button"]').click()
            waitPageProgress()
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveResellerPhonebookBy({name: 'phonebooktestr', authHeader})
            })
            cy.get('div[role="alert"]').should('have.class', 'bg-positive')
            cy.get('td[data-cy="q-td--name"] span').contains('phonebooktestr').should('be.visible')
            cy.get('td[data-cy="q-td--number"] span').contains('12345').should('be.visible')
        })

        it('Delete phonebook', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / phonebook')
            waitPageProgress()
            cy.locationShouldBe('#/phonebook')
            cy.get('span[data-cy="aui-data-table-highlighted-text"]').contains(ResellerPhonebook.name).parents('tr').find('td[data-cy="q-td--more-menu-left"]').click()
            cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
            cy.get('button[data-cy="btn-confirm"]').click()
            cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
        })
    })
})
