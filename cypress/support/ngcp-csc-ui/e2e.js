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

Cypress.Commands.add('expandMainMenuSection', (key) => {
    Cypress.log({
        name: 'expandMainMenuSection',
        displayName: 'expandMainMenuSection',
        message: ' : ' + key,
        autoEnd: true
    })

    const menuItemSelector = `.main-menu-items [data-cy=aui-main-menu-items--${key}]`
    const ownExpansionIconSelector = ' > .q-expansion-item__container > .q-item .q-expansion-item__toggle-icon'
    cy.get(`${menuItemSelector} ${ownExpansionIconSelector}`, quiet).then($icon => {
        // clicking on the section only if it's not expanded yet
        if (!$icon.hasClass('q-expansion-item__toggle-icon--rotated')) {
            cy.get(menuItemSelector, quiet).click(quiet)
        }
    })
})

Cypress.Commands.add('getMainMenuItem', (key) => {
    Cypress.log({
        name: 'getMainMenuItem',
        displayName: 'getMainMenuItem',
        message: ' : ' + key,
        autoEnd: true
    })

    return cy.get(`.main-menu-items [data-cy=aui-main-menu-item--${key}]`, quiet)
})

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
        cy.expandMainMenuSection(groupKey)
        cy.getMainMenuItem(subItemKey).click()
    } else if (pathParts.length === 1) {
        cy.getMainMenuItem(pathParts.pop()).click()
    }

    const waitPageProgress = () => {
        cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
        cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
    }

    if (waitForPageLoading) {
        waitPageProgress()
    }

    // // TODO: maybe we do not need to wait conditionally for the pages' data loading. So we can replace the complex check below with just an imput config parameter OR remove it completely
    // // TODO: it will be nice to replace it with a custom "auto retry" mechanism. Example: https://github.com/cypress-io/cypress-xpath/pull/12/files
    // const waitDataLoading = () => {
    //     cy.log('waiting for the page initialization...')
    //     cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
    //     cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
    // }
    // let's wait for loading an application's JS chunk for the page
    // cy.wait(50).then(() => {
    //     let $pageContextToolbar = Cypress.$('.q-page-container [data-cy=q-page-sticky]')
    //     if ($pageContextToolbar.length) {
    //         waitDataLoading()
    //     } else {
    //         cy.wait(500).then(() => {
    //             $pageContextToolbar = Cypress.$('.q-page-container [data-cy=q-page-sticky]')
    //             if ($pageContextToolbar.length) {
    //                 waitDataLoading()
    //             }
    //         })
    //     }
    // })
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
        const labelElementSelector = `label[data-cy="${dataCy}"]`
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
                    cy.wrap($parent).find(labelElementSelector).click()
                }
            }

            cy.wait(200)
            cy.wrap($parent).find(labelElementSelector).then($el => {
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
        const inputElementSelector = `[data-cy="${dataCy}"] input`
        const labelElementSelector = `label[data-cy="${dataCy}"]`
        ;(subject ? cy.wrap(subject) : cy.get('body')).then($parent => {
            if (filter) {
                cy.wrap($parent).find(inputElementSelector).type(filter)
            } else {
                cy.wrap($parent).find(inputElementSelector).click()
            }
            cy.wrap($parent).find(labelElementSelector).find('.q-spinner').should('be.visible')
            cy.wrap($parent).find(labelElementSelector).parent()
            cy.wrap($parent).find(labelElementSelector).find('.q-spinner').should('not.exist')

            cy.wait(500)
            cy.wrap($parent).find(labelElementSelector).then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                    .find('.q-linear-progress').should('not.exist')
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

    cy.intercept('POST', '**/login_jwt?lang=en').as('loginRequest')
    cy.get('input[data-cy="csc-login-username"]', quiet).type(username, quiet)
    cy.get('input[data-cy="csc-login-password"]', quiet).type(password, quiet)
    cy.get('button[data-cy="csc-login-button"]', quiet).click(quiet)
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
    cy.get('button[data-cy="user-menu"]', quiet).click(quiet)
    cy.get('div[data-cy="user-logout"]', quiet).click(quiet)
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
        url: `${ngcpConfig.apiHost}/api/soundsets`,
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
        if (body?.total_count === 1 && SoundSetId > 1) {
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
    cy.get('div[id="csc-page-main"] svg[data-cy="q-spinner-dots"]').should('be.visible')
    cy.get('div[id="csc-page-main"] svg[data-cy="q-spinner-dots"]').should('not.exist')
}

export const clickToolbarActionButton = (actionName) => {
    const selector = `div[data-cy=aui-list-action--${actionName}]`
    return cy
        .get(selector).should('not.have.attr', 'disable')
        .get(selector).click()
}
export const clickToolbarDropdownActionButton = (actionName) => {
    const selector = `[data-cy=aui-list-action-menu-item--${actionName}]`
    return cy
        .get(selector).should('not.have.attr', 'disable')
        .get(selector).click()
}
export const searchInDataTable = (searchText, searchCriteria = null) => {
    if (searchCriteria !== null) {
        cy.qSelect({ dataCy: 'aui-data-table-filter-criteria', filter: '', itemContains: searchCriteria })
        waitPageProgress()
    }
    cy.get('[data-cy="aui-input-search--datatable"] input').clear()
    cy.get('[data-cy="aui-input-search--datatable"] input').type(searchText)
    waitPageProgress()
}
export const deleteItemOnListPageBy = (searchText, searchCriteria = null) => {
    searchInDataTable(searchText, searchCriteria)
    cy.get('[data-cy=aui-data-table] .q-checkbox').click()
    clickToolbarActionButton('delete')
    cy.get('[data-cy="negative-confirmation-dialog"] [data-cy="btn-confirm"]').click()
    cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
}
export const clickDataTableSelectedMoreMenuItem = (actionName) => {
    cy.get('[data-cy="row-more-menu-btn"]:first').click()
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

function getChipBtnSelectors ({ value, itemPosition = 0 }) {
    const valueAsKebab = Cypress._.kebabCase(value)
    const dataCySelector = `[data-cy="q-chip--${valueAsKebab}-${itemPosition}"]`
    return {
        selector: dataCySelector,
        removeBtnSelector: dataCySelector + ' .q-chip__icon--remove'
    }
}

export const testPreferencesChipField = (name, testValues = { value1: 'testvalue', value2: 'testtestvalue' }, numbers = false) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    const tValue1 = {
        position0: getChipBtnSelectors({ value: testValues.value1, itemPosition: 0 }),
        position1: getChipBtnSelectors({ value: testValues.value1, itemPosition: 1 })
    }
    const tValue2 = {
        position0: getChipBtnSelectors({ value: testValues.value2, itemPosition: 0 }),
        position1: getChipBtnSelectors({ value: testValues.value2, itemPosition: 1 })
    }

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
    cy.get('@' + cyAliasName).find(tValue1.position0.selector)
    cy.get('@' + cyAliasName).find('input').type(testValues.value2)
    cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find(tValue2.position1.selector)
    cy.get('@' + cyAliasName).find(tValue1.position0.removeBtnSelector).click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find(tValue2.position0.selector).should('be.visible')
    cy.get('@' + cyAliasName).find(tValue1.position1.selector).should('not.exist')
    cy.get('@' + cyAliasName).find('input').type(testValues.value1)
    cy.get('@' + cyAliasName).find('button[data-cy="chip-add"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find(tValue1.position1.selector).should('exist')
    cy.get('@' + cyAliasName).find('button[data-cy="chip-removeall"]').click()
    cy.get('@' + cyAliasName).find('input[disabled="disabled"]').should('not.exist')
    cy.get('@' + cyAliasName).find('[data-cy^="q-chip"]').should('not.exist')
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
    cy.get('@' + cyAliasName).find('div[role=checkbox]').click()
    cy.get('@' + cyAliasName).find('div[role=checkbox][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=checkbox]').invoke('attr', 'aria-checked').should('eq', 'true')
    cy.get('@' + cyAliasName).find('div[role=checkbox]').click()
    cy.get('@' + cyAliasName).find('div[role=checkbox][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=checkbox]').invoke('attr', 'aria-checked').should('eq', 'false')
    cy.get('@' + cyAliasName).find('div[role=checkbox][aria-disabled="true"]').should('not.exist')
}
