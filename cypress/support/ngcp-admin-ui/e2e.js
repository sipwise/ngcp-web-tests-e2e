// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import 'cypress-wait-until'
import jwtDecode from 'jwt-decode'

const ngcpConfig = Cypress.config('ngcpConfig')
const debugging = false
const quiet = {
    log: debugging
}

Cypress.Commands.add('navigateMainMenu', (path = '', waitForPageLoading = true) => {
    Cypress.log({
        name: 'navigateMainMenu',
        displayName: 'navigateMainMenu',
        message: ' : ' + path,
        autoEnd: true
    })

    const pathParts = String(path).split('/').map(e => e.trim())
    if (pathParts.length === 2) {
        const [groupKey, subItemKey] = pathParts
        cy.get('div').contains('Settings').click()
        cy.wait(500)
        cy.get('a[href="#/' + subItemKey + '"]:first').click()
    } else if (pathParts.length === 1) {
        cy.get('a').should('have.attr', 'href', '#/' + subItemKey).click()
    }
})

Cypress.Commands.add('locationShouldBe', (urlHash) => {
    Cypress.log({
        name: 'locationShouldBe',
        displayName: 'locationShouldBe',
        message: urlHash,
        autoEnd: true
    })

    return cy.location('hash').should('eq', urlHash)
})

Cypress.Commands.add(
    'qSelect',
    { prevSubject: ['optional', 'element'] },
    (subject, { dataCy, filter, itemContains }) => {
        const inputElementSelector = `[data-cy="${dataCy}"].q-field__native`
        ;(subject ? cy.wrap(subject) : cy.get('body')).then($parent => {
            const inputElementExists = $parent.find(inputElementSelector).length

            if (typeof filter !== 'undefined' && filter !== '') {
                if (inputElementExists) {
                    cy.wrap($parent).find(inputElementSelector).type(filter)
                } else {
                    throw new Error('Current qSelect is not filterable')
                }
            } else {
                if (inputElementExists) {
                    cy.wrap($parent).find(inputElementSelector).click({ force: true })
                } else {
                    cy.wrap($parent).find(inputElementSelector).parents('label').click({ force: true })
                }
            }

            cy.wait(200)
            cy.wrap($parent).find(inputElementSelector).parents('label').then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                cy.contains(`${dropdownListId} .q-item`, itemContains).scrollIntoView()
                cy.contains(`${dropdownListId} .q-item`, itemContains).should('be.visible')
                cy.contains(`${dropdownListId} .q-item`, itemContains).click()
            })
        })
    }
)

Cypress.Commands.add('auiSelectLazySelect',
    { prevSubject: ['optional', 'element'] },
    (subject, { dataCy, filter, itemContains }) => {
        const inputElementSelector = `input[data-cy="${dataCy}"]`
        ;(subject ? cy.wrap(subject) : cy.get('body')).then($parent => {
            if (filter) {
                cy.wrap($parent).find(inputElementSelector).click()
                cy.wait(1000)
                cy.wrap($parent).find(inputElementSelector).type(filter + '{enter}')
            } else {
                cy.wrap($parent).find(inputElementSelector).click()
            }
            cy.get('.q-spinner').should('be.visible')
            cy.get('.q-spinner').should('not.exist')

            cy.wait(500)
            cy.wrap($parent).find(inputElementSelector).parents('label').then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                    .find('.q-linear-progress').should('not.exist')
                cy.wait(500)
                cy.contains(`${dropdownListId} .q-item`, itemContains).click()
            })
        })
    }
)

Cypress.Commands.add('loginAPI', (username, password) => {
    const log = Cypress.log({
        name: 'loginAPI',
        displayName: 'LOGIN (API)',
        message: `🔒 Authenticating: ${username}`,
        autoEnd: false
    })
    const ngcpConfig = Cypress.config('ngcpConfig')
    const loginData = {
        username,
        password
    }
    const apiLoginURL = `${ngcpConfig.apiHost}/login_jwt`

    return cy
        .request({
            method: 'POST',
            url: apiLoginURL,
            body: loginData,
            failOnStatusCode: false,
            ...quiet
        })
        .then((response) => {
            const statusCode = response.status || response.statusCode
            let jwt
            let adminId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                const decodedJwt = jwtDecode(jwt)
                adminId = decodedJwt.id

                const quasarFrameworkStrDataPrefix = '__q_strn|'
                const quasarFrameworkNumbDataPrefix = '__q_numb|'
                localStorage.aui_jwt = quasarFrameworkStrDataPrefix + jwt
                localStorage.aui_adminId = quasarFrameworkNumbDataPrefix + Number(adminId)
            }

            const logData = {
                apiURL: apiLoginURL,
                username,
                password,
                jwt,
                adminId
            }
            log.set({
                consoleProps () {
                    return logData
                }
            })
            log.end()

            return {
                ...logData,
                response
            }
        })
})

Cypress.Commands.add('loginUI', (username, password, waitForSidemenu = true) => {
    const log = Cypress.log({
        name: 'loginUI',
        displayName: 'LOGIN (UI)',
        message: `💻 🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    cy.intercept('POST', '**/login_jwt').as('loginRequest')
    cy.get('input[data-cy=aui-input-username]', quiet).type(username, quiet)
    cy.get('input[data-cy=aui-input-password]', quiet).type(password, quiet)
    cy.get('[data-cy=sign-in]', quiet).click(quiet)
    // eslint-disable-next-line cypress/no-assigning-return-values
    const reqResponse =
        cy.wait('@loginRequest', quiet).then(({ response }) => {
            const statusCode = response.status || response.statusCode
            let jwt
            let adminId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                const decodedJwt = jwtDecode(jwt)
                adminId = decodedJwt.id
            }

            const logData = {
                apiURL: undefined,
                username,
                password,
                jwt,
                adminId
            }
            log.set({
                consoleProps () {
                    return logData
                }
            })

            return { ...logData, response }
        })

    if (waitForSidemenu) {
        // Waiting for user data requesting \ initialization.
        // Note: Unfortunately we cannot fully relay on requests waiting because we might have different amount of requests
        //       according to the user type.
        //       So, to be sure that we are logged in we are waiting for an unique UI element of MainLayout
        cy.get('.q-drawer', quiet, { timeout: 10000 }).should('be.visible', quiet)
    }

    log.end()
    return reqResponse
})

const defaultLoginMode = 'api'
// const loginMode = 'ui'
Cypress.Commands.add('login', (username, password, loginMode = defaultLoginMode) => {
    let loginResponse
    if (String(loginMode).toLowerCase() === 'api') {
        loginResponse = cy.loginAPI(username, password)
        cy.visit('/')
        // adding wait here, to be sure that inputs are intractable \ accessible
        cy.wait(500)
    } else {
        cy.visit('/')
        // adding wait here, to be sure that inputs are intractable \ accessible
        cy.wait(500)
        loginResponse = cy.loginUI(username, password, false)
    }
    cy.get('.q-drawer', { timeout: 10000 }).should('be.visible')
    return loginResponse
})

Cypress.Commands.add('logoutUI', () => {
    const log = Cypress.log({
        name: 'logoutUI',
        displayName: 'LOGOUT (UI)',
        message: '🚪',
        autoEnd: true
    })

    cy.intercept('GET', '**/ajax_logout').as('v1LogoutRequest')
    cy.get('button[data-cy=usermenu-btn]', quiet).click(quiet)
    cy.get('[data-cy=logout-btn]', quiet).click(quiet)
    cy.wait('@v1LogoutRequest', quiet)
    cy.url(quiet).should((url) => {
        // NOTE: "should" does not support "{ log: false }" so it's a workaround for that
        const loginPageURL = /\/#\/login\/admin$/
        if (!loginPageURL.test(url)) {
            expect(url).to.match(loginPageURL)
        }
    })

    log.end()
})

Cypress.Commands.add('logout', () => {
    return cy.logoutUI()
})

export const apiLoginAsSuperuser = () => {
    return cy.loginAPI('administrator', 'administrator').then(({ jwt }) => {
        return {
            headers: {
                authorization: `Bearer ${jwt}`
            }
        }
    })
}

export const defaultAdminContractCreationData = {
    read_only: false,
    billing_data: true,
    is_active: true,
    role_id: 3,
    password: 'string',
    email: 'user@example.com',
    show_passwords: true,
    call_data: true,
    login: 'string',
    is_master: true,
    can_reset_password: true,
    reseller_id: 0
}

export const apiCreateAdmin = ({ data, authHeader }) => {
    cy.log('apiCreateAdmin', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/admins/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveAdminBy = ({ name, authHeader }) => {
    cy.log('apiRemoveAdminBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/admins`,
        qs: {
            login: name
        },
        ...authHeader
    }).then(({ body }) => {
        const adminId = body?._embedded?.['ngcp:admins']?.[0]?.id
        if (body?.total_count === 1 && adminId > 1) {
            cy.log('Deleting admin...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/admins/${adminId}`,
                ...authHeader
            })
        } else {
            return cy.log('Admin not found', name)
        }
    })
}

export const defaultResellerContractCreationData = {
    contact_id: 3,
    status: 'active',
    external_id: null,
    billing_profiles: [{
        profile_id: 1,
        start: null,
        stop: null
    }],
    type: 'reseller',
    billing_profile_definition: 'profiles'
}

export const apiCreateContract = ({ data, authHeader }) => {
    cy.log('apiCreateContract', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/contracts/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetContractId = ({ name, authHeader }) => {
    cy.log('apiGetContractId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/contracts`,
        qs: {
            external_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contractData = body?._embedded?.['ngcp:contracts']?.[0]
        const contractId = contractData?.id
        return contractId
    })
}

export const apiRemoveContractBy = ({ name, authHeader }) => {
    cy.log('apiRemoveContractBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/contracts`,
        qs: {
            external_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contractData = body?._embedded?.['ngcp:contracts']?.[0]
        const contractId = contractData?.id
        const contractStatus = contractData?.status
        if (body?.total_count === 1 && contractId > 1 && contractStatus !== 'terminated') {
            cy.log('Deleting contract...', name)
            return cy.request({
                method: 'PATCH',
                url: `${ngcpConfig.apiHost}/api/contracts/${contractId}`,
                body: [
                    { op: 'replace', path: '/status', value: 'terminated' }
                ],
                headers: {
                    ...authHeader.headers,
                    'content-type': 'application/json-patch+json'
                }
            })
        } else {
            return cy.log('Contact not found', name)
        }
    })
}

export const defaultResellerCreationData = {
    name: '',
    contract_id: 0,
    status: 'active',
    enable_rtc: false
}

export const apiCreateReseller = ({ data, authHeader }) => {
    cy.log('apiCreateReseller', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/resellers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetResellerId = ({ name, authHeader }) => {
    cy.log('apiGetResellerId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerData = body?._embedded?.['ngcp:resellers']?.[0]
        const resellerId = resellerData?.id
        return resellerId
    })
}

export const apiRemoveResellerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveResellerBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerData = body?._embedded?.['ngcp:resellers']?.[0]
        const resellerId = resellerData?.id
        const resellerStatus = resellerData?.status
        if (body?.total_count === 1 && resellerId > 1 && resellerStatus !== 'terminated') {
            cy.log('Deleting reseller...', name)
            return cy.request({
                method: 'PATCH',
                url: `${ngcpConfig.apiHost}/api/resellers/${resellerId}`,
                body: [
                    { op: 'replace', path: '/status', value: 'terminated' }
                ],
                headers: {
                    ...authHeader.headers,
                    'content-type': 'application/json-patch+json'
                }
            })
        } else {
            return cy.log('System contact not found', name)
        }
    })
}

export const defaultDomainCreationData = {
    domain: 'string',
    reseller_id: 0
}

export const apiCreateDomain = ({ data, authHeader }) => {
    cy.log('apiCreateDomain', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/domains/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveDomainBy = ({ name, authHeader }) => {
    cy.log('apiRemoveDomainBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/domains`,
        qs: {
            domain: name
        },
        ...authHeader
    }).then(({ body }) => {
        const domainId = body?._embedded?.['ngcp:domains']?.[0]?.id
        if (domainId) {
            cy.log('Deleting domain...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/domains/${domainId}`,
                ...authHeader
            })
        } else {
            return cy.log('Domain not found', name)
        }
    })
}

export const defaultCustomerCreationData = {
    billing_profile_definition: 'id',
    invoice_template_id: 0,
    passreset_email_template_id: 0,
    subscriber_email_template_id: 0,
    billing_profile_id: 0,
    invoice_email_template_id: 0,
    profile_package_id: 0,
    external_id: 'string',
    contact_id: 0,
    status: 'active',
    type: 'sipaccount',
    max_subscribers: 0
}

export const apiCreateCustomer = ({ data, authHeader }) => {
    cy.log('apiCreateCustomer', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/customers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetCustomerId = ({ name, authHeader }) => {
    cy.log('apiGetCustomerId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customers`,
        qs: {
            external_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const customerData = body?._embedded?.['ngcp:customers']?.[0]
        const customerId = customerData?.id
        return customerId
    })
}

export const apiRemoveCustomerById = ({ id, authHeader }) => {
    cy.log('apiRemoveCustomerById', id)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customers/${id}`,
        ...authHeader
    }).then((res) => {
        if (res?.body?.id && res?.body.status !== 'terminated') {
            cy.log('Terminating customer by id...', id)
            return cy.request({
                method: 'PATCH',
                url: `${ngcpConfig.apiHost}/api/customers/${res.body.id}`,
                body: [
                    { op: 'replace', path: '/status', value: 'terminated' }
                ],
                headers: {
                    ...authHeader.headers,
                    'content-type': 'application/json-patch+json'
                }
            })
        }
        
        return cy.log('Customer not found or already terminated...', id)
    })
}

export const apiRemoveCustomerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCustomerBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customers`,
        qs: {
            external_id: name,
            status: 'active'
        },
        ...authHeader
    }).then(({ body }) => {
        const customers = body?._embedded?.['ngcp:customers']
        if (customers && customers.length > 0) {
            customers.forEach((customer) => {
                    cy.log(`Terminating customer ${customer.id}`, name)
                    return cy.request({
                        method: 'PATCH',
                        url: `${ngcpConfig.apiHost}/api/customers/${customer.id}`,
                        body: [
                            { op: 'replace', path: '/status', value: 'terminated' }
                        ],
                        headers: {
                            ...authHeader.headers,
                            'content-type': 'application/json-patch+json'
                        }
                    })
            })
        } else {
            return cy.log(`Customer not found`, name)
        }
    })
}

export const defaultSubscriberCreationData = {
    is_pbx_pilot: true,
    lock: null,
    display_name: 'string',
    domain_id: 0,
    username: 'string',
    administrative: true,
    password: 'string',
    webusername: 'string',
    pbx_extension: 'string',
    status: 'active',
    is_pbx_group: true,
    domain: 'string',
    webpassword: 'string',
    email: 'user@example.com',
    profile_id: 0,
    profile_set_id: 0,
    external_id: 'string',
    timezone: 'string'
}

export const apiCreateSubscriber = ({ data, authHeader }) => {
    cy.log('apiCreateSubscriber', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscribers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetSubscriberId = ({ name, authHeader }) => {
    cy.log('apiGetSubscriberId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscribers`,
        qs: {
            username: name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberData = body?._embedded?.['ngcp:subscribers']?.[0]
        const subscriberId = subscriberData?.id
        return subscriberId
    })
}

export const apiRemoveSubscriberBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscribers`,
        qs: {
            username: name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberId = body?._embedded?.['ngcp:subscribers']?.[0]?.id
        if (subscriberId) {
            cy.log('Deleting subscriber...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscribers/${subscriberId}`,
                ...authHeader
            })
        } else {
            return  cy.log('Subscriber not found', name)
        }
    })
}

export const defaultSystemContactCreationData = {
    bic: 'string',
    lastname: 'string',
    street: 'string',
    email: 'user@example.com',
    gpp0: 'string',
    firstname: 'string',
    postcode: 'string',
    faxnumber: 'string',
    country: 'string',
    iban: 'string',
    comregnum: 'string',
    city: 'string',
    phonenumber: 'string',
    vatnum: 'string',
    bankname: 'string',
    company: 'string',
    mobilenumber: 'string',
    timezone: 0
}

export const apiCreateSystemContact = ({ data, authHeader }) => {
    cy.log('apiCreateSystemContact', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/systemcontacts/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetSystemContactId = ({ name, authHeader }) => {
    cy.log('apiGetSystemContactId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/systemcontacts`,
        qs: {
            email: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contactData = body?._embedded?.['ngcp:systemcontacts']?.[0]
        const contactId = contactData?.id
        return contactId
    })
}

export const apiRemoveSystemContactBy = ({ email, authHeader }) => {
    cy.log('apiRemoveSystemContactBy', email)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/systemcontacts`,
        qs: {
            email
        },
        ...authHeader
    }).then(({ body }) => {
        const contactId = body?._embedded?.['ngcp:systemcontacts']?.[0]?.id
        if (body?.total_count === 1 && contactId > 1) {
            cy.log('Deleting system contact...', email)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/systemcontacts/${contactId}`,
                ...authHeader
            })
        } else {
            return cy.log('System contact not found', email)
        }
    })
}

export const defaultCustomerContactCreationData = {
    city: 'string',
    bic: 'string',
    bankname: 'string',
    timezone: 0,
    mobilenumber: 'string',
    postcode: 'string',
    firstname: 'string',
    email: 'user@example.com',
    gpp0: 'string',
    faxnumber: 'string',
    phonenumber: 'string',
    street: 'string',
    country: 'string',
    vatnum: 'string',
    company: 'string',
    lastname: 'string',
    comregnum: 'string',
    reseller_id: 0,
    iban: 'string'
}

export const apiCreateCustomerContact = ({ data, authHeader }) => {
    cy.log('apiCreateCustomerContact', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/customercontacts/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetCustomerContactId = ({ name, authHeader }) => {
    cy.log('apiGetCustomerContactId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customercontacts`,
        qs: {
            email: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contactData = body?._embedded?.['ngcp:customercontacts']?.[0]
        const contactId = contactData?.id
        return contactId
    })
}

export const apiRemoveCustomerContactsByIds = ({ ids, authHeader }) => {
    cy.log('apiRemoveCustomerContactBy', ids)
    ids.forEach((id) => {
        return cy.request({
            method: 'GET',
            url: `${ngcpConfig.apiHost}/api/customercontacts/${id}`,
            ...authHeader
        }).then(({ body }) => {
                if (body?.id) {
                    cy.log('Deleting customer contact by id...', id)
                    return cy.request({
                        method: 'DELETE',
                        url: `${ngcpConfig.apiHost}/api/customercontacts/${body.id}`,
                        ...authHeader
                    })
                 }
                return cy.log('Customer contact not found', id)
        })
    })
    
}

export const apiRemoveCustomerContactBy = ({ email, authHeader }) => {
    cy.log('apiRemoveCustomerContactBy', email)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customercontacts`,
        qs: {
            email
        },
        ...authHeader
    }).then(({ body }) => {
        const contacts = body?._embedded?.['ngcp:customercontacts']
        if (contacts && contacts.length > 0) {
            cy.log('Deleting customer contact...', email)
            return contacts.forEach((contact) => {
                return cy.request({
                    method: 'DELETE',
                    url: `${ngcpConfig.apiHost}/api/customercontacts/${contact.id}`,
                    ...authHeader
                })
            })
            
        } else {
            return cy.log('Customer contact not found', email)
        }
    })
}

export const defaultEmergencyMappingContainerCreationData = {
    name: 'string',
    reseller_id: 0
}

export const apiCreateEmergencyMappingContainer = ({ data, authHeader }) => {
    cy.log('apiCreateEmergencyMappingContainer', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveEmergencyMappingContainerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveEmergencyMappingContainerBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const emcId = body?._embedded?.['ngcp:emergencymappingcontainers']?.[0]?.id
        if (body?.total_count === 1 && emcId > 1) {
            cy.log('Deleting emergency mapping container...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers/${emcId}`,
                ...authHeader
            })
        } else {
            return cy.log('Emergency mapping container not found', name)
        }
    })
}

export const defaultEmergencyMappingCreationData = {
    prefix: "string",
    code: "string",
    suffix: "string",
    emergency_container_id: 0
}

export const apiCreateEmergencyMapping = ({ data, authHeader }) => {
    cy.log('apiCreateEmergencyMapping', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/emergencymappings/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveEmergencyMappingBy = ({ name, authHeader }) => {
    cy.log('apiRemoveEmergencyMappingBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/emergencymappings`,
        qs: {
            code: name
        },
        ...authHeader
    }).then(({ body }) => {
        const emcId = body?._embedded?.['ngcp:emergencymappings']?.[0]?.id
        if (body?.total_count === 1 && emcId >= 1) {
            cy.log('Deleting emergency mapping...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappings/${emcId}`,
                ...authHeader
            })
        } else {
            return cy.log('No emergency mapping found')
        }
    })
}

export const defaultSubscriberProfileSetCreationData = {
    set_default: false,
    description: 'string',
    name: 'string'
}

export const apiCreateSubscriberProfileSet = ({ data, authHeader }) => {
    cy.log('apiCreateSubscriberProfileSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscriberprofilesets/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetSubscriberProfileSetId = ({ name, authHeader }) => {
    cy.log('apiGetSubscriberProfileSetId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberprofilesets`,
        qs: {
            username : name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetData = body?._embedded?.['ngcp:subscriberprofilesets']?.[0]
        const subscriberProfileSetId = subscriberProfileSetData?.id
        return subscriberProfileSetId
    })
}

export const apiRemoveSubscriberProfileSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberProfileSetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberprofilesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetId = body?._embedded?.['ngcp:subscriberprofilesets']?.[0]?.id
        if (subscriberProfileSetId) {
            cy.log('Deleting subscriber profile set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofilesets/${subscriberProfileSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No subscriber profile set found')
        }
    })
}

export const defaultResellerPhonebookData = {
    name: "string",
    reseller_id: 0,
    id: 0,
    number: "string"
}

export const apiCreateResellerPhonebook = ({ data, authHeader }) => {
    cy.log('apiCreateResellerPhonebook', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/resellerphonebookentries/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetResellerPhonebookId = ({ name, authHeader }) => {
    cy.log('apiGetResellerPhonebookId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellerphonebookentries`,
        qs: {
            username : name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetData = body?._embedded?.['ngcp:resellerphonebookentries']?.[0]
        const subscriberProfileSetId = subscriberProfileSetData?.id
        return subscriberProfileSetId
    })
}

export const apiRemoveResellerPhonebookBy = ({ name, authHeader }) => {
    cy.log('apiRemoveResellerPhonebookBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellerphonebookentries`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetId = body?._embedded?.['ngcp:resellerphonebookentries']?.[0]?.id
        if (body?.total_count === 1 && subscriberProfileSetId >= 1) {
            cy.log('Deleting reseller phonebook...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/resellerphonebookentries/${subscriberProfileSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No reseller phonebook found', name)
        }
    })
}

export const defaultBillingProfileCreationData = {
    name: 'string',
    handle: 'string',
    reseller_id: 0
}

export const apiCreateBillingProfile = ({ data, authHeader }) => {
    cy.log('apiCreateBillingProfile', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/billingprofiles/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetBillingProfileId = ({ name, authHeader }) => {
    cy.log('apiGetBillingProfileId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingprofiles`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileData = body?._embedded?.['ngcp:billingprofiles']?.[0]
        const billingProfileId = billingProfileData?.id
        return billingProfileId
    })
}

export const apiRemoveBillingProfileBy = ({ name, authHeader }) => {
    cy.log('apiRemoveBillingProfileBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingprofiles`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileId = body?._embedded?.['ngcp:billingprofiles']?.[0]?.id
        if (body?.total_count === 1 && billingProfileId > 1) {
            cy.log('Deleting billing profile...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingprofiles/${billingProfileId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing profile not found', name)
        }
    })
}

export const defaultBillingProfileZoneCreationData = {
    detail: 'string',
    zone: 'string',
    billingprofile_id: 0
}

export const apiCreateBillingProfileZone = ({ data, authHeader }) => {
    cy.log('apiCreateBillingProfileZone', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/billingzones/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetBillingProfileZoneId = ({ name, authHeader }) => {
    cy.log('apiGetBillingProfileZoneId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingzones`,
        qs: {
            zone: name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileZoneData = body?._embedded?.['ngcp:billingzones']?.[0]
        const billingProfileZoneId = billingProfileZoneData?.id
        return billingProfileZoneId
    })
}

export const apiRemoveBillingProfileZoneBy = ({ zone, authHeader }) => {
    cy.log('apiRemoveBillingProfileZoneBy', zone)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingzones`,
        qs: {
            zone
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileZoneId = body?._embedded?.['ngcp:billingzones']?.[0]?.id
        if (body?.total_count === 1 && billingProfileZoneId > 1) {
            cy.log('Deleting billing profile zone...', zone)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingzones/${billingProfileZoneId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing profile zone not found', zone)
        }
    })
}

export const defaultBillingProfileFeeCreationData = {
    destination: "string",
    billing_zone_id: 0,
    offpeak_init_interval: 0,
    onpeak_init_interval: 0,
    direction: "in",
    offpeak_extra_rate: 0,
    onpeak_extra_rate: 0,
    offpeak_init_rate: 0,
    source: "string",
    offpeak_follow_interval: 0,
    match_mode: "regex_longest_pattern",
    aoc_pulse_amount_per_message: 0,
    onpeak_use_free_time: true,
    onpeak_follow_interval: 0,
    billing_profile_id: 0,
    offpeak_follow_rate: 0,
    purge_existing: true,
    offpeak_extra_second: 0,
    onpeak_extra_second: 0,
    onpeak_init_rate: 0,
    offpeak_use_free_time: true,
    onpeak_follow_rate: 0
}

export const apiCreateBillingProfileFee = ({ data, authHeader }) => {
    cy.log('apiCreateBillingProfileFee', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/billingfees/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetBillingProfileFeeId = ({ name, authHeader }) => {
    cy.log('apiGetBillingProfileFeeId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingfees`,
        qs: {
            destination: name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileFeeData = body?._embedded?.['ngcp:billingfees']?.[0]
        const billingProfileFeeId = billingProfileFeeData?.id
        return billingProfileFeeId
    })
}

export const apiRemoveBillingProfileFeeBy = ({ name, authHeader }) => {
    cy.log('apiRemoveBillingProfileFeeBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingfees`,
        qs: {
            destination: name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileFeeId = body?._embedded?.['ngcp:billingfees']?.[0]?.id
        if (body?.total_count === 1 && billingProfileFeeId > 1) {  
            cy.log('Deleting billing profile fee...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingfees/${billingProfileFeeId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing profile fee not found', name)
        }
    })
}

export const defaultRewriteRuleSetCreationData = {
    description: 'string',
    name: 'string',
    reseller_id: 0
}

export const apiCreateRewriteRuleSet = ({ data, authHeader }) => {
    cy.log('apiCreateRewriteRuleSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/rewriterulesets/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetRewriteRuleSetId = ({ name, authHeader }) => {
    cy.log('apiGetRewriteRuleSetId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRuleSetData = body?._embedded?.['ngcp:rewriterulesets']?.[0]
        const rewriteRuleSetId = rewriteRuleSetData?.id
        return rewriteRuleSetId
    })
}

export const apiRemoveRewriteRuleSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveRewriteRuleSetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRuleSetId = body?._embedded?.['ngcp:rewriterulesets']?.[0]?.id
        if (body?.total_count === 1 && rewriteRuleSetId > 1) {
            cy.log('Deleting rewrite rule set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterulesets/${rewriteRuleSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No rewrite rule set found', name)
        }
    })
}

export const defaultRewriteRuleCreationData = {
    priority: 0,
    description: "string",
    set_id: 0,
    enabled: true,
    direction: "in",
    replace_pattern: "string",
    match_pattern: "string",
    field: "callee"
}

export const apiCreateRewriteRules = ({ data, authHeader }) => {
    cy.log('apiCreateRewriteRules', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/rewriterules/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetRewriteRulesId = ({ name, authHeader }) => {
    cy.log('apiGetRewriteRulesId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterules`,
        qs: {
            description: name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRulesData = body?._embedded?.['ngcp:rewriterules']?.[0]
        const rewriteRulesId = rewriteRulesData?.id
        return rewriteRulesId
    })
}

export const apiRemoveRewriteRulesBy = ({ name, authHeader }) => {
    cy.log('apiRemoveRewriteRulesBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterules`,
        qs: {
            description: name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRulesId = body?._embedded?.['ngcp:rewriterules']?.[0]?.id
        if (body?.total_count === 1 && rewriteRulesId > 1) {
            cy.log('Deleting rewrite rules...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterules/${rewriteRulesId}`,
                ...authHeader
            })
        } else {
            return cy.log('No rewrite rules found', name)
        }
    })
}

export const defaultNCOSLevelCreationData = {
    reseller_id: 0,
    level: 'string',
    mode: 'whitelist',
    description: 'string'
}

export const apiCreateNCOSLevel = ({ data, authHeader }) => {
    cy.log('apiCreateNCOSLevel', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/ncoslevels/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetNCOSLevelId = ({ name, authHeader }) => {
    cy.log('apiGetNCOSLevelId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslevels`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLevelData = body?._embedded?.['ngcp:ncoslevels']?.[0]
        const NCOSLevelId = NCOSLevelData?.id
        return NCOSLevelId
    })
}

export const apiRemoveNCOSLevelBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSLevelBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslevels`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLevelId = body?._embedded?.['ngcp:ncoslevels']?.[0]?.id
        if (body?.total_count === 1 && NCOSLevelId >= 1) {
            cy.log('Deleting NCOS level...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslevels/${NCOSLevelId}`,
                ...authHeader
            })
        } else {
            return cy.log('NCOS level not found', name)
        }
    })
}

export const defaultNCOSLNPCarrierCreationData = {
    carrier_id: 0,
    description: "string",
    ncos_level_id: 0
}

export const apiCreateNCOSLNPCarrier = ({ data, authHeader }) => {
    cy.log('apiCreateNCOSLNPCarrier', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetNCOSNCOSLNPCarrier = ({ level, authHeader }) => {
    cy.log('apiGetNCOSNCOSLNPCarrier', level)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers`,
        qs: {
            level
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierData = body?._embedded?.['ngcp:ncoslnpcarriers']?.[0]
        const NCOSLNPCarrierId = NCOSLNPCarrierData?.id
        return NCOSLNPCarrierId
    })
}

export const apiRemoveNCOSLNPCarrierBy = ({ level, authHeader }) => {
    cy.log('apiRemoveNCOSLNPCarrierBy', level)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers`,
        qs: {
            level
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierId = body?._embedded?.['ngcp:ncoslnpcarriers']?.[0]?.id
        if (body?.total_count === 1 && NCOSLNPCarrierId >= 1) {
            cy.log('Deleting NCOS LNP carrier...', level)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers/${NCOSLNPCarrierId}`,
                ...authHeader
            })
        } else {
            return cy.log('NCOS LNP carrier not found', level)
        }
    })
}

export const defaultNCOSLNPPatternCreationData = {
    ncos_lnp_list_id: 0,
    pattern: "string",
    description: "string"
}

export const apiCreateNCOSLNPPattern = ({ data, authHeader }) => {
    cy.log('apiCreateNCOSLNPPattern', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/ncoslnppatterns/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetNCOSLNPPattern = ({ name, authHeader }) => {
    cy.log('apiGetNCOSLNPPattern', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnppatterns`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPPatternData = body?._embedded?.['ngcp:ncoslnppatterns']?.[0]
        const NCOSLNPPatternId = NCOSLNPPatternData?.id
        return NCOSLNPPatternId
    })
}

export const apiRemoveNCOSLNPPatternBy = ({ level, authHeader }) => {
    cy.log('apiRemoveNCOSLNPPatternBy', level)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnppatterns`,
        qs: {
            level
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierId = body?._embedded?.['ngcp:ncoslnppatterns']?.[0]?.id
        if (body?.total_count === 1 && NCOSLNPCarrierId >= 1) {
            cy.log('Deleting NCOS LNP patttern...', level)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslnppatterns/${NCOSLNPCarrierId}`,
                ...authHeader
            })
        } else {
            return y.log('NCOS LNP patttern not found', level)
        }
    })
}

export const defaultNCOSPatternCreationData = {
    description: "string",
    ncos_level_id: 0,
    pattern: "string"
}

export const apiCreateNCOSPattern = ({ data, authHeader }) => {
    cy.log('apiCreateNCOSPattern', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/ncospatterns/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetNCOSPatternId = ({ name, authHeader }) => {
    cy.log('apiGetNCOSPatternId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncospatterns`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSPatternData = body?._embedded?.['ngcp:ncospatterns']?.[0]
        const NCOSPatternId = NCOSPatternData?.id
        return NCOSPatternId
    })
}

export const apiRemoveNCOSPatternBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSPatternBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncospatterns`,
        qs: {
            pattern:name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSSetId = body?._embedded?.['ngcp:ncospatterns']?.[0]?.id
        if (body?.total_count === 1 && NCOSSetId >= 1) {
            cy.log('Deleting ncos pattern...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncospatterns/${NCOSSetId}`,
                ...authHeader
            })
        } else {
            return null
        }
    })
}

export const apiRemoveNCOSSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSSetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/v2/ncos/sets/`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const ncosSets = body?._embedded?.['ngcp:ncos/sets']
        if (ncosSets && ncosSets.length > 0) {
            ncosSets.forEach((set) => {
                cy.log('Deleting ncos set...', name)
                return cy.request({
                    method: 'DELETE',
                    url: `${ngcpConfig.apiHost}/api/v2/ncos/sets/${set.id}`,
                    ...authHeader
                })
            })
            
        } else {
            return cy.log('Ncos set not found', name)
        }
    })
}

export const defaultSoundSetCreationData = {
    replace_existing: true,
    contract_default: true,
    language: 'en',
    name: 'string',
    description: 'string',
    reseller_id: 0,
    copy_from_default: true,
    loopplay: true
}

export const apiCreateSoundSet = ({ data, authHeader }) => {
    cy.log('apiCreateSoundSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/soundsets/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetSoundSetId = ({ name, authHeader }) => {
    cy.log('apiGetSoundSetId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/soundsets/`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const SoundSetData = body?._embedded?.['ngcp:soundsets']?.[0]
        const SoundSetId = SoundSetData?.id
        return SoundSetId
    })
}

export const apiRemoveSoundSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSoundSetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/soundsets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const SoundSetId = body?._embedded?.['ngcp:soundsets']?.[0]?.id
        if (body?.total_count === 1 && SoundSetId >= 1) {
            cy.log('Deleting sound set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/soundsets/${SoundSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('Sound set not found', name)
        }
    })
}

export const defaultlLocationmappingCreationData = {
    external_id: 'string',
    mode: 'add',
    location: 'string',
    to_username: 'string',
    caller_pattern: 'string',
    callee_pattern: 'string',
    subscriber_id: 0,
    enabled: true
}

export const apiCreateLocationMapping = ({ data, authHeader }) => {
    cy.log('apiCreateLocationMapping', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetLocationMappingId = ({ name, authHeader }) => {
    cy.log('apiGetLocationMappingId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings`,
        qs: {
            external_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const LocationHeaderData = body?._embedded?.['ngcp:subscriberlocationmappings']?.[0]
        const LocationHeaderId = LocationHeaderData?.id
        return LocationHeaderId
    })
}

export const apiRemoveLocationMappingBy = ({ external_id, authHeader }) => {
    cy.log('apiRemoveLocationMappingBy', external_id)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings`,
        qs: {
            external_id
        },
        ...authHeader
    }).then(({ body }) => {
        const LocationHeaderId = body?._embedded?.['ngcp:subscriberlocationmappings']?.[0]?.id
        if (body?.total_count === 1 && LocationHeaderId > 1) {
            cy.log('Deleting Location mapping...', external_id)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings/${LocationHeaderId}`,
                ...authHeader
            })
        } else {
            return cy.log('Location mapping not found', external_id)
        }
    })
}

export const defaultSubscriberProfileCreationData = {
    name: 'string',
    profile_set_id: 0,
    attribute: {},
    set_default: true,
    description: 'string'
}

export const apiCreateSubscriberProfile = ({ data, authHeader }) => {
    cy.log('apiCreateSubscriberProfile', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscriberprofiles/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetSubscriberProfileId = ({ name, authHeader }) => {
    cy.log('apiGetSubscriberProfileId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberprofiles`,
        qs: {
            username : name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileData = body?._embedded?.['ngcp:subscriberprofiles']?.[0]
        const subscriberProfileId = subscriberProfileData?.id
        return subscriberProfileId
    })
}

export const apiRemoveSubscriberProfileBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberProfileBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberprofiles`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileId = body?._embedded?.['ngcp:subscriberprofiles']?.[0]?.id
        if (subscriberProfileId) {
            cy.log('Deleting subscriber profile...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofiles/${subscriberProfileId}`,
                ...authHeader
            })
        } else {
            return cy.log('Subscriber profile not found', name)
        }
    })
}

export const defaultTimesetCreationData = {
    calendarfile: "string",
    name: "string",
    reseller_id: "id"
}

export const apiCreateTimeset = ({ data, authHeader }) => {
    cy.log('apiCreateTimeset', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/timesets/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetTimesetId = ({ name, authHeader }) => {
    cy.log('apiGetTimesetId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/timesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const timesetData = body?._embedded?.['ngcp:timesets']?.[0]
        const timesetId = timesetData?.id
        return timesetId
    })
}

export const apiRemoveTimesetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveTimesetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/timesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const timesetID = body?._embedded?.['ngcp:timesets']?.[0]?.id
        if (body?.total_count === 1 && timesetID >= 1) {
            cy.log('Deleting timeset...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/timesets/${timesetID}`,
                ...authHeader
            })
        } else {
            return cy.log('Timeset not found', name)
        }
    })
}

export const defaultProfilePackageCreationData = {
    balance_interval_unit: "minute",
    balance_interval_value: 0,
    description: "string",
    name: "string",
    initial_profiles: [
        {
          profile_id: 0,
        }
      ],
}

export const apiCreateProfilePackage = ({ data, authHeader }) => {
    cy.log('apiCreateProfilePackage', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/profilepackages/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetProfilePackageId = ({ name, authHeader }) => {
    cy.log('apiGetProfilePackageId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/profilepackages`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const profilePackageData = body?._embedded?.['ngcp:profilepackages']?.[0]
        const profilePackageId = profilePackageData?.id
        return profilePackageId
    })
}

export const apiRemoveProfilePackageBy = ({ name, authHeader }) => {
    cy.log('apiRemoveProfilePackageBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/profilepackages`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const profilePackageID = body?._embedded?.['ngcp:profilepackages']?.[0]?.id
        if (body?.total_count === 1 && profilePackageID > 1) {
            cy.log('Deleting profile package...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/profilepackages/${profilePackageID}`,
                ...authHeader
            })
        } else {
            return cy.log('Profile package not found', name)
        }
    })
}

export const defaultHeaderRulesetCreationData = {
    name: "string",
    description: "string",
    subscriber_id: 0,
    reseller_id: 0,
    rules: {}
}

export const apiCreateHeaderRuleset = ({ data, authHeader }) => {
    cy.log('apiCreateHeaderRuleset', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/headerrulesets/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetHeaderRulesetId = ({ name, authHeader }) => {
    cy.log('apiGetHeaderRulesetId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRulesetData = body?._embedded?.['ngcp:headerrulesets']?.[0]
        const HeaderRulesetId = HeaderRulesetData?.id
        return HeaderRulesetId
    })
}

export const apiRemoveHeaderRulesetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveHeaderRulesetBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRulesetID = body?._embedded?.['ngcp:headerrulesets']?.[0]?.id
        if (body?.total_count === 1 && HeaderRulesetID >= 1) {
            cy.log('Deleting header rule set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerrulesets/${HeaderRulesetID}`,
                ...authHeader
            })
        } else {
            return cy.log('Header rule set not found', name)
        }
    })
}

export const defaultHeaderRuleCreationData = {
    stopper: true,
    enabled: true,
    direction: "a_inbound",
    description: "string",
    name: "string",
    set_id: 0,
    priority: 0
}

export const apiCreateHeaderRule = ({ data, authHeader }) => {
    cy.log('apiCreateHeaderRule', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/headerrules/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetHeaderRuleId = ({ name, authHeader }) => {
    cy.log('apiGetHeaderRuleId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrules`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleData = body?._embedded?.['ngcp:headerrules']?.[0]
        const HeaderRuleId = HeaderRuleData?.id
        return HeaderRuleId
    })
}

export const apiRemoveHeaderRuleBy = ({ name, authHeader }) => {
    cy.log('apiRemoveHeaderRuleBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrules`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleID = body?._embedded?.['ngcp:headerrules']?.[0]?.id
        if (body?.total_count === 1 && HeaderRuleID >= 1) {
            cy.log('Deleting header rule...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerrules/${HeaderRuleID}`,
                ...authHeader
            })
        } else {
            return cy.log('Header rule not found', name)
        }
    })
}

export const defaultHeaderRuleConditionCreationData = {
    values: [
        {
          value: "string"
        }
      ],
    match_part: "full",
    rwr_dp: "",
    enabled: true,
    match_name: "string",
    match_type: "header",
    expression_negation: true,
    rule_id: 0,
    rwr_set_id: 0,
    expression: "is",
    value_type: "input"
}

export const apiCreateHeaderRuleCondition = ({ data, authHeader }) => {
    cy.log('apiCreateHeaderRuleCondition', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/headerruleconditions/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetHeaderRuleConditionId = ({ name, authHeader }) => {
    cy.log('apiGetHeaderRuleConditionId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleconditions`,
        qs: {
            match_name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleConditionData = body?._embedded?.['ngcp:headerruleconditions']?.[0]
        const HeaderRuleConditionId = HeaderRuleConditionData?.id
        return HeaderRuleConditionId
    })
}

export const apiRemoveHeaderRuleConditionBy = ({ name, authHeader }) => {
    cy.log('apiRemoveHeaderRuleConditionBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleconditions`,
        qs: {
            match_name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleConditionID = body?._embedded?.['ngcp:headerruleconditions']?.[0]?.id
        if (body?.total_count === 1 && HeaderRuleConditionID >= 1) {
            cy.log('Deleting header rule condition...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerruleconditions/${HeaderRuleConditionID}`,
                ...authHeader
            })
        } else {
            return cy.log('Header rule condition not found', name)
        }
    })
}

export const defaultHeaderRuleActionCreationData = {
    rwr_dp: "",
    enabled: true,
    priority: 0,
    action_type: "set",
    header: "string",
    header_part: "full",
    value_part: "full",
    value: "string",
    rwr_set_id: 0,
    rule_id: 0
}

export const apiCreateHeaderRuleAction = ({ data, authHeader }) => {
    cy.log('apiCreateHeaderRuleAction', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/headerruleactions/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetHeaderRuleActionId = ({ name, authHeader }) => {
    cy.log('apiGetHeaderRuleActionId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleactions`,
        qs: {
            header: name
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleActionData = body?._embedded?.['ngcp:headerruleactions']?.[0]
        const HeaderRuleActionId = HeaderRuleActionData?.id
        return HeaderRuleActionId
    })
}

export const apiRemoveHeaderRuleActionBy = ({ header, authHeader }) => {
    cy.log('apiRemoveHeaderRuleActionBy', header)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleactions`,
        qs: {
            header
        },
        ...authHeader
    }).then(({ body }) => {
        const HeaderRuleActionID = body?._embedded?.['ngcp:headerruleactions']?.[0]?.id
        if (body?.total_count === 1 && HeaderRuleActionID >= 1) {
            cy.log('Deleting header rule action...', header)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerruleactions/${HeaderRuleActionID}`,
                ...authHeader
            })
        } else {
            return cy.log('Header rule action not found', header)
        }
    })
}

export const defaultLNPCarrierCreationData = {
    name: "string",
    authoritative: true,
    skip_rewrite: true,
    prefix: "string"
}

export const apiCreateLNPCarrier = ({ data, authHeader }) => {
    cy.log('apiCreateLNPCarrier', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/lnpcarriers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetLNPCarrierId = ({ name, authHeader }) => {
    cy.log('apiGetLNPCarrierId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpcarriers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPCarrierData = body?._embedded?.['ngcp:lnpcarriers']?.[0]
        const LNPCarrierId = LNPCarrierData?.id
        return LNPCarrierId
    })
}

export const apiRemoveLNPCarrierBy = ({ name, authHeader }) => {
    cy.log('apiRemoveLNPCarrierBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpcarriers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPCarrierID = body?._embedded?.['ngcp:lnpcarriers']?.[0]?.id
        if (body?.total_count === 1 && LNPCarrierID >= 1) {
            cy.log('Deleting LNP carrier...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/lnpcarriers/${LNPCarrierID}`,
                ...authHeader
            })
        } else {
            return cy.log('LNP carrier not found', name)
        }
    })
}

export const defaultLNPNumberCreationData = {
    number: "string",
    end: "string",
    start: "string",
    type: "string",
    carrier_id: 0,
    routing_number: "string"
}

export const apiCreateLNPNumber = ({ data, authHeader }) => {
    cy.log('apiCreateLNPNumber', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/lnpnumbers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetLNPNumberId = ({ name, authHeader }) => {
    cy.log('apiGetLNPNumberId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpnumbers`,
        qs: {
            number: name
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPNumberData = body?._embedded?.['ngcp:lnpnumbers']?.[0]
        const LNPNumberId = LNPNumberData?.id
        return LNPNumberId
    })
}

export const apiRemoveLNPNumberBy = ({ number, authHeader }) => {
    cy.log('apiRemoveLNPNumberBy', number)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpnumbers`,
        qs: {
            number
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPNumberId = body?._embedded?.['ngcp:lnpnumbers']?.[0]?.id
        if (body?.total_count === 1 && LNPNumberId >= 1) {
            cy.log('Deleting LNP number...', number)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/lnpnumbers/${LNPNumberId}`,
                ...authHeader
            })
        } else {
            return cy.log('LNP number not found', number)
        }
    })
}

export const defaultPeeringGroupCreationData = {
    time_set_id: 0,
    name: "string",
    description: "string",
    contract_id: 0,
    priority: "1"
}

export const apiCreatePeeringGroup = ({ data, authHeader }) => {
    cy.log('apiCreatePeeringGroup', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/peeringgroups/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetPeeringGroupId = ({ name, authHeader }) => {
    cy.log('apiGetPeeringGroupId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringgroups `,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringGroupData = body?._embedded?.['ngcp:peeringgroups']?.[0]
        const PeeringGroupId = PeeringGroupData?.id
        return PeeringGroupId
    })
}

export const apiRemovePeeringGroupBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringGroupBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringgroups`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringGroupId = body?._embedded?.['ngcp:peeringgroups']?.[0]?.id
        if (body?.total_count === 1 && PeeringGroupId >= 1) {
            cy.log('Deleting peering group...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringgroups/${PeeringGroupId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering group not found', name)
        }
    })
}

export const defaultPeeringInboundRuleCreationData = {
    reject_reason: "string",
    field: "from_user",
    reject_code: 0,
    enabled: true,
    priority: 0,
    group_id: 0,
    pattern: "string"
}

export const apiCreatePeeringInboundRule = ({ data, authHeader }) => {
    cy.log('apiCreatePeeringInboundRule', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/peeringinboundrules/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetPeeringInboundRule = ({ name, authHeader }) => {
    cy.log('apiGetPeeringInboundRule', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringinboundrules`,
        qs: {
            pattern: name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringInboundRuleData = body?._embedded?.['ngcp:peeringinboundrules']?.[0]
        const PeeringInboundRuleId = PeeringInboundRuleData?.id
        return PeeringInboundRuleId
    })
}

export const apiRemovePeeringInboundRuleBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringInboundRuleBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringinboundrules`,
        qs: {
            group_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringInboundRuleId = body?._embedded?.['ngcp:peeringinboundrules']?.[0]?.id
        if (body?.total_count === 1 && PeeringInboundRuleId >= 1) {
            cy.log('Deleting peering inbound rule...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringinboundrules/${PeeringInboundRuleId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering inbound rule not found', name)
        }
    })
}

export const defaultPeeringOutboundRuleCreationData = {
    stopper: true,
    caller_pattern: "string",
    callee_pattern: "string",
    callee_prefix: "string",
    description: "string",
    group_id: 0,
    enabled: true
}

export const apiCreatePeeringOutboundRule = ({ data, authHeader }) => {
    cy.log('apiCreatePeeringOutboundRule', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/peeringrules/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetPeeringOutboundRule = ({ name, authHeader }) => {
    cy.log('apiGetPeeringOutboundRule', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringrules`,
        qs: {
            description: name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringOutboundRuleData = body?._embedded?.['ngcp:peeringrules']?.[0]
        const PeeringOutboundRuleId = PeeringOutboundRuleData?.id
        return PeeringOutboundRuleId
    })
}

export const apiRemovePeeringOutboundRuleBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringOutboundRuleBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringrules`,
        qs: {
            description: name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringOutboundRuleId = body?._embedded?.['ngcp:peeringrules']?.[0]?.id
        if (body?.total_count === 1 && PeeringOutboundRuleId >= 1) {
            cy.log('Deleting peering outbound rule...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringrules/${PeeringOutboundRuleId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering outbound rule not found', name)
        }
    })
}

export const defaultPeeringServerCreationData = {
    transport: "1",
    weight: 0,
    probe: true,
    enabled: true,
    port: 0,
    host: "string",
    via_route: "",
    group_id: 0,
    name: "string",
    ip: "string"
}

export const apiCreatePeeringServer = ({ data, authHeader }) => {
    cy.log('apiCreatePeeringServer', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/peeringservers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiGetPeeringServerId = ({ name, authHeader }) => {
    cy.log('apiGetPeeringServerId', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringservers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringServerData = body?._embedded?.['ngcp:peeringservers']?.[0]
        const PeeringServerId = PeeringServerData?.id
        return PeeringServerId
    })
}

export const apiRemovePeeringServerBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringServerBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringservers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const PeeringServerId = body?._embedded?.['ngcp:peeringservers']?.[0]?.id
        if (body?.total_count === 1 && PeeringServerId >= 1) {
            cy.log('Deleting peering server...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringservers/${PeeringServerId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering server not found', name)
        }
    })
}

export const apiGetMailboxLastItem = ({ mailboxName, filterSubject }) => {
    cy.log('apiGetMailboxLastItem', mailboxName)
    return cy.request({
        method: 'GET',
        url: `https://autoprov.lab.sipwise.com/smtp/api/v1/mailbox/${mailboxName}`,
        encoding: 'utf-8'
    }).then(({ body }) => {
        const mailsList = body || []
        const finalList = (filterSubject === undefined || filterSubject === null)
            ? mailsList
            : mailsList.filter(item => item?.subject.indexOf(filterSubject) >= 0)
        return finalList.pop()
    })
}

export const apiGetMail = ({ mailboxName, id }) => {
    cy.log('apiGetMail', mailboxName)
    return cy.request({
        method: 'GET',
        url: `https://autoprov.lab.sipwise.com/smtp/api/v1/mailbox/${mailboxName}/${id}`,
        encoding: 'utf-8'
    }).then(({ body }) => {
        return body?.body?.text
    })
}

export const getRandomNum = (maxLength = 5) => Math.floor((Math.random() * Math.pow(10, maxLength)) + 1)

export const waitPageProgress = () => {
    cy.get('div[class="q-linear-progress"][role="progressbar"]').should('be.visible')
    cy.get('div[class="q-linear-progress"][role="progressbar"]').should('not.exist')
}

export const searchInDataTable = (searchText, searchCriteria = null, waitPageProgressCheck = true) => {
    cy.get('label[data-cy="aui-data-table-filter-criteria"][aria-disabled="true"]').should('not.exist')
    if (searchCriteria !== null) {
        cy.qSelect({ dataCy: 'aui-data-table-filter-criteria', filter: '', itemContains: searchCriteria })
        cy.get('label[data-cy="aui-input-search--datatable"][aria-disabled="true"]').should('not.exist')
    }
    cy.get('input[data-cy="aui-input-search--datatable"]').clear()
    cy.get('input[data-cy="aui-input-search--datatable"]').type(searchText)
    if (waitPageProgressCheck) {
        waitPageProgress()
    }
}

export const deleteItemOnListPageBy = (searchText = null, searchCriteria = null) => {
    if (searchText !== null) {
        searchInDataTable(searchText, searchCriteria)
    }
    cy.get('div[class="aui-data-table"] .q-checkbox').click()
    cy.get('button[data-cy="aui-list-action--delete"]').click()
    cy.get('[data-cy="btn-confirm"]').click()
    if (searchText !== null) {
        cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
    } else {
        cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
    }
}

export const clickDataTableSelectedMoreMenuItem = (actionName) => {
    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
    return cy.get(`.q-menu [data-cy="aui-data-table-row-menu--${actionName}"]`).click()
}

export const deleteDownloadsFolder = () => {
    const downloadsFolder = Cypress.config('downloadsFolder')
    cy.task('deleteFolder', downloadsFolder)
}

function getPreferencesFieldInfo (fieldName) {
    const dataCy = Cypress._.kebabCase(fieldName)
    const dataCySelector = `div[data-cy="q-item--${dataCy}"]`
    const cyAliasName = Cypress._.camelCase(fieldName)
    return { dataCy, dataCySelector, cyAliasName }
}

export const testPreferencesChipField = (name, testValues = { value1: 'testvalue', value2: 'testtestvalue' }, numbers = false) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)

    if (numbers) {
        cy.get('@' + cyAliasName).find('input').type('invalid')
        cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
        cy.get('@' + cyAliasName).find('.q-field--error').should('exist')
        cy.get('@' + cyAliasName).find('input').clear()
    }

    cy.get('@' + cyAliasName).find('input').clear()
    cy.get('@' + cyAliasName).find('input').type(testValues.value1)
    cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').contains(testValues.value1)
    cy.get('@' + cyAliasName).find('input').type(testValues.value2)
    cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').contains(testValues.value2)
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').contains(testValues.value1).parents('div[class="q-chip row inline no-wrap items-center q-chip--dense"]').find('i[aria-label="Remove"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').contains(testValues.value2).should('be.visible')
    cy.get('@' + cyAliasName).find(testValues.value1).should('not.exist')
    cy.get('@' + cyAliasName).find('input').type(testValues.value1)
    cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').contains(testValues.value1).should('be.visible')
    cy.get('@' + cyAliasName).find('button[data-cy="chip-removeall"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[class="ellipsis"]').should('not.exist')
}

export const testPreferencesTextField = (name, value = 'test', onlyNumbers = false) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('input').type(value)
    cy.get('button[data-cy="preference-save"]').click()
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('input').should('have.value', value)
    cy.get('@' + cyAliasName).contains('i[data-cy="q-icon"]', 'cancel').click()
    cy.get('button[data-cy="preference-save"]').click()
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('input').should('have.value', '')
    cy.get('@' + cyAliasName).find('input').type(value)
    cy.get('button[data-cy="preference-reset"]').click()
    cy.get('@' + cyAliasName).find('input').should('have.value', '')
    if (onlyNumbers) {
        cy.get('@' + cyAliasName).find('input').type('test')
        cy.get('button[data-cy="preference-save"]').should('not.exist')
    }
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
}

export const testPreferencesListField = (name, entry = null) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('label').click()
    cy.get('div[role="listbox"]').should('be.visible')
    cy.wait(1000)
    cy.get('div[role="listbox"]').contains(entry).click()
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
}

export const testPreferencesToggleField = (name) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('div[role=switch]').click()
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=switch]').invoke('attr', 'aria-checked').should('eq', 'true')
    cy.get('@' + cyAliasName).find('div[role=switch]').click()
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=switch]').invoke('attr', 'aria-checked').should('eq', 'false')
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
}
