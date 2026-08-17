/// <reference types="cypress" />

import {
    apiLoginAsSuperuser,
    apiCreateContract,
    apiCreateReseller,
    apiCreateSystemContact,
    apiRemoveContractBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    waitPageProgressAUI,
    deleteItemOnListPageBy,
    searchInDataTable,
    apiCreateBillingNetwork,
    apiRemoveBillingNetworkBy
} from '../../../support/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractBillingNetwork',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const reseller = {
    contract_id: 1,
    status: 'active',
    name: 'resellerBillingNetwork',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContact@example.com',
    firstname: 'Testfirstname',
    lastname: 'Testlastname'
}

const billingNetwork = {
  blocks: [
    {
      ip: '1.1.1.1',
      mask: 16
    },
    {
      ip: '2.2.2.2',
      mask: 16
    }
  ],
  description: 'billingNetworkTestsDescripton',
  reseller_id: 0,
  name: 'billingNetworkTests'
}

const secondBillingNetwork = {
  blocks: [
    {
      ip: '3.3.3.3',
      mask: 16
    },
    {
      ip: '4.4.4.4',
      mask: 16
    }
  ],
  description: 'secondBillingNetworkTestsDescripton',
  reseller_id: 0,
  name: 'secondBillingNetworkTests'
}

const deleteBillingNetwork = {
  blocks: [
    {
      ip: '5.5.5.5',
      mask: 16
    },
    {
      ip: '6.6.6.6',
      mask: 16
    }
  ],
  description: 'deleteBillingNetworkTestsDescripton',
  reseller_id: 0,
  name: 'deleteBillingNetworkTests'
}

context('Billing Network', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
        apiLoginAsSuperuser().then(authHeader => {
            Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
            apiRemoveBillingNetworkBy({ name: deleteBillingNetwork.name, authHeader })
            apiRemoveBillingNetworkBy({ name: secondBillingNetwork.name, authHeader })
            apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader})
            apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader })
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
            cy.log('Data clean up pre-tests completed')
            apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                contract.contact_id = id
            })
        })
    })

    after(() => {
        Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
        cy.log('Data clean up...')
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: deleteBillingNetwork.name, authHeader })
            apiRemoveBillingNetworkBy({ name: secondBillingNetwork.name, authHeader })
            apiRemoveBillingNetworkBy({ name: billingNetwork.name, authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
        })
    })

    it('Try to create a Billing Network with invalid values', () => {
        // Setup: Create Reseller
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / network', false)

        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('button[data-cy="aui-save-button"]').click()
        cy.get('label[data-cy="billingnetworks-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('label[data-cy="billingnetworks-description"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
        cy.get('label[data-cy="billingnetworks-name"]').type(billingNetwork.name)
        cy.get('label[data-cy="billingnetworks-description"]').type(billingNetwork.description)
        cy.get('label[data-cy="billingnetworks-ip"]').type('invalidip')
        cy.get('label[data-cy="billingnetworks-mask"]').type('badmask')
        cy.get('button[data-cy="aui-save-button"]').click()
        cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')
        cy.get('label[data-cy="billingnetworks-mask"]').find('div[role="alert"]').contains('Input must be no longer than 3 characters').should('be.visible')
        cy.get('label[data-cy="billingnetworks-ip"]').clear().type('123.421.123.80')
        cy.get('button[data-cy="aui-save-button"]').click()
        cy.get('label[data-cy="billingnetworks-ip"]').find('div[role="alert"]').contains('Input must be a valid IPv4 or IPv6').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
        })
    })

    it('Create a Billing Network', () => {
        // Setup: Create Reseller, delete Billing Network if exists
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / network', false)

        cy.get('a[data-cy="aui-list-action--add"]').click()
        cy.get('label[data-cy="billingnetworks-name"]').type(billingNetwork.name + "2")
        cy.get('label[data-cy="billingnetworks-description"]').type(billingNetwork.description)
        cy.get('label[data-cy="billingnetworks-ip"]').type(billingNetwork.blocks[0].ip)
        cy.get('label[data-cy="billingnetworks-mask"]').type(billingNetwork.blocks[0].mask)
        cy.get('button[data-cy="billingnetworks-newblock"]').click()
        cy.get('label[data-cy="billingnetworks-ip"]:last').type(billingNetwork.blocks[1].ip)
        cy.get('label[data-cy="billingnetworks-mask"]:last').type(billingNetwork.blocks[1].mask)
        cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: reseller.name, itemContains: reseller.name })
        cy.get('button[data-cy="aui-save-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        searchInDataTable(billingNetwork.name + "2", "Name")
        cy.get('td[data-cy="q-td--name"]').contains(billingNetwork.name + "2").should('be.visible')
        cy.get('td[data-cy="q-td--blocks"]').contains(billingNetwork.blocks[0].ip + '/' + billingNetwork.blocks[0].mask + ', ' + billingNetwork.blocks[1].ip + '/' + billingNetwork.blocks[1].mask).should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: billingNetwork.name + "2", authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
        })
    })

    it('Edit a Billing Network, search with IPs instead of name', () => {
        // Setup: Create Reseller and Billing Network
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: secondBillingNetwork, authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                    apiCreateBillingNetwork({ data: { ...secondBillingNetwork, reseller_id: id }, authHeader })
                })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / network', false)

        searchInDataTable(secondBillingNetwork.blocks[0].ip, "IP")
        cy.get('div[class="aui-data-table"] .q-checkbox').click()
        cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
        cy.get('a[data-cy="aui-data-table-row-menu--billingNetworkEdit"]').click()
        waitPageProgressAUI()
        cy.get('input[data-cy="billingnetworks-ip"]:first').clear().type('1.1.1.1')
        cy.get('input[data-cy="billingnetworks-mask"]:first').clear().type('16')
        cy.get('input[data-cy="billingnetworks-ip"]:last').clear().type('2.2.2.2')
        cy.get('input[data-cy="billingnetworks-mask"]:last').clear().type('16')
        cy.get('button[data-cy="aui-save-button"]').click()
        cy.get('[data-cy="aui-close-button"]').click()
        cy.get('div[role="alert"]').should('have.class', 'bg-positive')
        searchInDataTable(billingNetwork.blocks[0].ip, "IP")
        cy.get('td[data-cy="q-td--name"]').contains(secondBillingNetwork.name).should('be.visible')
        cy.get('td[data-cy="q-td--blocks"]').contains('1.1.1.1/16').should('be.visible')
        searchInDataTable(secondBillingNetwork.name, "Name")
        cy.get('td[data-cy="q-td--name"]').contains(secondBillingNetwork.name).should('be.visible')
        cy.get('td[data-cy="q-td--blocks"]').contains('1.1.1.1/16').should('be.visible')

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: secondBillingNetwork.name, authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
        })
    })

    it('Delete a Billing Network', () => {
        // Setup: Create Reseller and Billing Network
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: deleteBillingNetwork.name, authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
            apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                    apiCreateBillingNetwork({ data: { ...deleteBillingNetwork, reseller_id: id }, authHeader })
                })
            })
        })

        cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
        cy.navigateMainMenu('settings / network', false)

        deleteItemOnListPageBy(deleteBillingNetwork.name, "Name")

        // Cleanup
        apiLoginAsSuperuser().then(authHeader => {
            apiRemoveBillingNetworkBy({ name: deleteBillingNetwork.name, authHeader})
            apiRemoveResellerBy({ name: reseller.name, authHeader })
            apiRemoveContractBy({ name: contract.external_id, authHeader })
        })
    })
})
