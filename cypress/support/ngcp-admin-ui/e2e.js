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
                    cy.wrap($parent).find(inputElementSelector).click()
                } else {
                    cy.wrap($parent).find(inputElementSelector).parents('label').click()
                }
            }

            cy.wait(200)
            cy.wrap($parent).find(inputElementSelector).parents('label').then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
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
    cy.log('apiCreateAdmin', name)
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
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/admins/${adminId}`,
                ...authHeader
            })
        } else {
            return null
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
            return null
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
            name: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerData = body?._embedded?.['ngcp:resellers']?.[0]
        const resellerId = resellerData?.id
        const resellerStatus = resellerData?.status
        if (body?.total_count === 1 && resellerId > 1 && resellerStatus !== 'terminated') {
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
            return null
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
        if (body?.total_count === 1 && domainId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/domains/${domainId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveCustomerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCustomerBy', name)
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
        const customerStatus = customerData?.status
        if (body?.total_count === 1 && customerId > 1 && customerStatus !== 'terminated') {
            return cy.request({
                method: 'PATCH',
                url: `${ngcpConfig.apiHost}/api/customers/${customerId}`,
                body: [
                    { op: 'replace', path: '/status', value: 'terminated' }
                ],
                headers: {
                    ...authHeader.headers,
                    'content-type': 'application/json-patch+json'
                }
            })
        } else {
            return null
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
        if (body?.total_count === 1 && subscriberId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscribers/${subscriberId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveSystemContactBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSystemContactBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/systemcontacts`,
        qs: {
            email: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contactId = body?._embedded?.['ngcp:systemcontacts']?.[0]?.id
        if (body?.total_count === 1 && contactId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/systemcontacts/${contactId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveCustomerContactBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCustomerContactBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customercontacts`,
        qs: {
            email: name
        },
        ...authHeader
    }).then(({ body }) => {
        const contactId = body?._embedded?.['ngcp:customercontacts']?.[0]?.id
        if (body?.total_count === 1 && contactId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/customercontacts/${contactId}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const emcId = body?._embedded?.['ngcp:emergencymappingcontainers']?.[0]?.id
        if (body?.total_count === 1 && emcId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers/${emcId}`,
                ...authHeader
            })
        } else {
            return null
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
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappings/${emcId}`,
                ...authHeader
            })
        } else {
            return null
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
            username: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetId = body?._embedded?.['ngcp:subscriberprofilesets']?.[0]?.id
        if (body?.total_count === 1 && subscriberProfileSetId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofilesets/${subscriberProfileSetId}`,
                ...authHeader
            })
        } else {
            return null
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
            username: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileSetId = body?._embedded?.['ngcp:resellerphonebookentries']?.[0]?.id
        if (body?.total_count === 1 && subscriberProfileSetId >= 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/resellerphonebookentries/${subscriberProfileSetId}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileId = body?._embedded?.['ngcp:billingprofiles']?.[0]?.id
        if (body?.total_count === 1 && billingProfileId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingprofiles/${billingProfileId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveBillingProfileZoneBy = ({ name, authHeader }) => {
    cy.log('apiRemoveBillingProfileZoneBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingzones`,
        qs: {
            zone: name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileZoneId = body?._embedded?.['ngcp:billingzones']?.[0]?.id
        if (body?.total_count === 1 && billingProfileZoneId > 1) {  
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingzones/${billingProfileZoneId}`,
                ...authHeader
            })
        } else {
            return null
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
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingfees/${billingProfileFeeId}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRuleSetId = body?._embedded?.['ngcp:rewriterulesets']?.[0]?.id
        if (body?.total_count === 1 && rewriteRuleSetId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterulesets/${rewriteRuleSetId}`,
                ...authHeader
            })
        } else {
            return null
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
        if (body?.total_count === 1 && rewriteRules > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterules/${rewriteRulesId}`,
                ...authHeader
            })
        } else {
            return null
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
        if (body?.total_count === 1 && NCOSLevelId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslevels/${NCOSLevelId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiGetNCOSNCOSLNPCarrier = ({ name, authHeader }) => {
    cy.log('apiGetNCOSNCOSLNPCarrier', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierData = body?._embedded?.['ngcp:ncoslnpcarriers']?.[0]
        const NCOSLNPCarrierId = NCOSLNPCarrierData?.id
        return NCOSLNPCarrierId
    })
}

export const apiRemoveNCOSLNPCarrierBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSLNPCarrierBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierId = body?._embedded?.['ngcp:ncoslnpcarriers']?.[0]?.id
        if (body?.total_count === 1 && NCOSLNPCarrierId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslnpcarriers/${NCOSLNPCarrierId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveNCOSLNPPatternBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSLNPPatternBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslnppatterns`,
        qs: {
            level: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLNPCarrierId = body?._embedded?.['ngcp:ncoslnppatterns']?.[0]?.id
        if (body?.total_count === 1 && NCOSLNPCarrierId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslnppatterns/${NCOSLNPCarrierId}`,
                ...authHeader
            })
        } else {
            return null
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
            pattern: name
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSPatternId = body?._embedded?.['ngcp:ncospatterns']?.[0]?.id
        if (body?.total_count === 1 && NCOSPatternId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncospatterns/${NCOSPatternId}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const SoundSetId = body?._embedded?.['ngcp:soundsets']?.[0]?.id
        if (body?.total_count === 1 && SoundSetId >= 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/soundsets/${SoundSetId}`,
                ...authHeader
            })
        } else {
            return null
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

export const apiRemoveLocationMappingBy = ({ name, authHeader }) => {
    cy.log('apiRemoveLocationMappingBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings`,
        qs: {
            external_id: name
        },
        ...authHeader
    }).then(({ body }) => {
        const LocationHeaderId = body?._embedded?.['ngcp:subscriberlocationmappings']?.[0]?.id
        if (body?.total_count === 1 && LocationHeaderId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings/${LocationHeaderId}`,
                ...authHeader
            })
        } else {
            return null
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
            username: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberProfileId = body?._embedded?.['ngcp:subscriberprofiles']?.[0]?.id
        if (body?.total_count === 1 && subscriberProfileId > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofiles/${subscriberProfileId}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const timesetID = body?._embedded?.['ngcp:timesets']?.[0]?.id
        if (body?.total_count === 1 && timesetID >= 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/timesets/${timesetID}`,
                ...authHeader
            })
        } else {
            return null
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
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const profilePackageData = body?._embedded?.['ngcp:profilepackages']?.[0]
        const profilePackageId = profilePackageData?.id
        return timesetId
    })
}

export const apiRemoveProfilePackageBy = ({ name, authHeader }) => {
    cy.log('apiRemoveProfilePackageBy', name)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/profilepackages`,
        qs: {
            name: name
        },
        ...authHeader
    }).then(({ body }) => {
        const profilePackageID = body?._embedded?.['ngcp:profilepackages']?.[0]?.id
        if (body?.total_count === 1 && profilePackageID > 1) {
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/profilepackages/${profilePackageID}`,
                ...authHeader
            })
        } else {
            return null
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

export const searchInDataTable = (searchText, searchCriteria = null) => {
    if (searchCriteria !== null) {
        cy.qSelect({ dataCy: 'aui-data-table-filter-criteria', filter: '', itemContains: searchCriteria })
        cy.get('label[data-cy="aui-input-search--datatable"][aria-disabled="true"]').should('not.exist')
    }
    cy.get('input[data-cy="aui-input-search--datatable"]').clear()
    cy.get('input[data-cy="aui-input-search--datatable"]').type(searchText)
    waitPageProgress()
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
    cy.get('@' + cyAliasName).contains('button[data-cy="q-icon"]', 'cancel').click()
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
