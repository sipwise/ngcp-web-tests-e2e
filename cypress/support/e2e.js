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

// Mirrors Quasar's LocalStorage type-prefixing (see quasar/src/plugins/storage/engine/web-storage.js)
// so values written directly to `localStorage` (bypassing the LocalStorage plugin) are readable by the app.
const QUASAR_STORAGE_PREFIX = {
    string: '__q_strn|',
    number: '__q_numb|'
}

function setQuasarLocalStorage (key, value, type = 'string') {
    localStorage[key] = QUASAR_STORAGE_PREFIX[type] + value
}

Cypress.Commands.add('navigateMainMenu', (path = '', waitForPageLoading = true) => {
    Cypress.log({
        name: 'navigateMainMenu',
        displayName: 'navigateMainMenu',
        message: ' : ' + path,
        autoEnd: true
    });

    const pathParts = String(path).split('/').map(e => e.trim());
    if (pathParts.length === 2) {
        const [ _ , subItemKey] = pathParts;
        cy.get('div').contains('Settings').click();
        cy.get('a[href="#/' + subItemKey + '"]:first').click();

    } else if (pathParts.length === 1) {
        const subItemKey = pathParts[0];
        cy.get('a[href="#/' + subItemKey + '"]:first').click();
    }

    if (waitForPageLoading) {
        cy.get('div[class="q-linear-progress"][role="progressbar"]').should('be.visible');
        cy.get('div[class="q-linear-progress"][role="progressbar"]').should('not.exist')
    }
});

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
    (subject, { dataCy, filter, itemContains, first = false, last = false }) => {
        let inputElementSelector = `[data-cy="${dataCy}"].q-field__native`
        if(first) {
            inputElementSelector += ':first'
        }
        if(last) {
            inputElementSelector += ':last'
        }
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
                cy.get('div[role="listbox"]').should('be.visible')
                cy.wrap($parent).find(inputElementSelector).type(filter)
            } else {
                cy.wrap($parent).find(inputElementSelector).click()
            }

            cy.get('div[role="listbox"]').should('not.be.visible')
            cy.get('div[role="listbox"]').should('be.visible')

            cy.wrap($parent).find(inputElementSelector).parents('label').then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                cy.get(dropdownListId + ' .q-linear-progress').should('not.exist')
                cy.wait(500)
                cy.contains(`${dropdownListId} .q-item`, itemContains).last().click()
                cy.get('div[role="listbox"]').should('not.exist')
            })
        })
    }
)

/*

The `loginAPI`, `loginUI` and `quickLogin` commands are used to authenticate a user,
but they do so in different ways:

### `quickLogin` Command
- This command performs authentication by directly making an API request to the backend.
- It calls loginAPI() to authenticate the user and then navigates to the home page.
- This method bypasses the UI. It asserts the login API call returned a 200 before navigating,
  then double-checks the login succeeded by checking the presence of the side menu.
- Useful for all those cases where we are not interested in testing the UI login flow.

### `loginUI` Command
- This command performs authentication by interacting with the UI elements of the login page.
- It receives as argument username, password and a boolean to indicate if it should wait for the side menu to be visible.
- It fills in the username and password fields and clicks the sign-in button.
- It waits for the login request to complete and verifies the presence of the JWT token in the response.
- This method is useful where you want to simulate a real user logging in through the UI.

### `loginAPI` Command
- This command performs authentication by directly making an API request to the backend.
- It sends a POST request to the `/login_jwt` endpoint with the username and password.
- If the response is successful, it stores the JWT in local storage together with the id the app
  keys the session on (the admin id decoded from the JWT for AUI, the subscriber id from the
  response body for CSC), matching how each app's store persists a successful login.
- It does not throw on a failed login: it resolves with the raw response so callers (including
  tests that intentionally log in with bad credentials) can inspect the status themselves.
- This method bypasses the UI completely.
*/

Cypress.Commands.add('AUIloginAPI', (username, password) => {
    const log = Cypress.log({
        name: 'AUIloginAPI',
        displayName: 'LOGIN (API)',
        message: `🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    const loginData = {
        username,
        password
    }

    const ngcpConfig = Cypress.config('ngcpConfig')
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

                setQuasarLocalStorage('aui_jwt', jwt)
                setQuasarLocalStorage('aui_adminId', Number(adminId), 'number')
            }

            const logData = {
                apiURL: apiLoginURL,
                username,
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

Cypress.Commands.add('CSCloginAPI', (username, password) => {
    const log = Cypress.log({
        name: 'CSCloginAPI',
        displayName: 'LOGIN (API) CSC',
        message: `🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    const loginData = {
        username,
        password
    }

    const apiLoginURL = `${Cypress.config('baseUrl')}/login_jwt`

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
            let subscriberId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                subscriberId = response.body.subscriber_id

                setQuasarLocalStorage('csc_jwt', jwt)
                setQuasarLocalStorage('csc_subscriberId', subscriberId)
            }

            const logData = {
                apiURL: apiLoginURL,
                username,
                jwt,
                subscriberId
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

Cypress.Commands.add('quickLoginAUI', (username, password) => {
    cy.clearLocalStorage()
    const loginResponse = cy.AUIloginAPI(username, password).then((result) => {
        const statusCode = result.response.status || result.response.statusCode
        expect(statusCode, `AUI API login failed for user "${username}"`).to.equal(200)
        return result
    })
    cy.visit('/')
    // adding wait here, to be sure that inputs are intractable \ accessible
    cy.wait(500)
    cy.get('.q-drawer', { timeout: 10000 }).should('be.visible')
    cy.get('a[href="#/dashboard"]').should('be.visible')
    return loginResponse
})

Cypress.Commands.add('quickLoginCSC', (username, password) => {
    cy.clearLocalStorage()
    const loginResponse = cy.CSCloginAPI(username, password).then((result) => {
        const statusCode = result.response.status || result.response.statusCode
        expect(statusCode, `CSC API login failed for user "${username}"`).to.equal(200)
        return result
    })
    cy.visit('/')
    // adding wait here, to be sure that inputs are intractable \ accessible
    cy.wait(500)
    cy.get('.q-drawer', { timeout: 10000 }).should('be.visible')
    cy.get('a[href="#/user/dashboard"]').should('be.visible')
    return loginResponse
})

Cypress.Commands.add('loginUiAUI', (username, password, waitForSidemenu = true) => {
    const log = Cypress.log({
        name: 'loginUiAUI',
        displayName: 'LOGIN UI (AUI)',
        message: `💻 🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    cy.intercept('POST', '**/login_jwt').as('loginRequest')
    cy.get('input[data-cy=aui-input-username][aria-disabled="true"]').should('not.exist')
    cy.get('input[data-cy=aui-input-password][aria-disabled="true"]').should('not.exist')
    cy.get('input[data-cy=aui-input-username]', quiet).type(username, quiet)
    cy.get('input[data-cy=aui-input-password]', quiet).type(password, quiet)
    cy.get('[data-cy=sign-in]', quiet).click(quiet)

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
        // according to the user type.
        // So, to be sure that we are logged in we are waiting for an unique UI element of MainLayout
        cy.get('.q-drawer', quiet, { timeout: 10000 }).should('be.visible', quiet)
        cy.get('a[href="#/dashboard"]').should('be.visible')
    }

    log.end()
})

Cypress.Commands.add('loginUiCSC', (username, password, waitForSidemenu = true) => {
    const log = Cypress.log({
        name: 'loginUI',
        displayName: 'LOGIN (UI)',
        message: `💻 🔒 Authenticating: ${username}`,
        autoEnd: false
    })

    cy.intercept('POST', '**/login_jwt').as('loginRequest')
    cy.get('input[data-cy="csc-login-username"][aria-disabled="true"]').should('not.exist')
    cy.get('input[data-cy="csc-login-password"][aria-disabled="true"]').should('not.exist')
    cy.get('input[data-cy="csc-login-username"]', quiet).type(username, quiet)
    cy.get('input[data-cy="csc-login-password"]', quiet).type(password, quiet)
    cy.get('button[data-cy="csc-login-button"]', quiet).click(quiet)
    // eslint-disable-next-line cypress/no-assigning-return-values
    const reqResponse =
        cy.wait('@loginRequest', quiet).then(({ response }) => {
            const statusCode = response.status || response.statusCode
            let jwt
            let subscriberId
            if (Number(statusCode) === 200) {
                jwt = response.body.jwt
                subscriberId = response.body.subscriber_id
            }

            const logData = {
                apiURL: undefined,
                username,
                password,
                jwt,
                subscriberId
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
        cy.get('a[href="#/user/dashboard"]').should('be.visible')
    }

    log.end()
    return reqResponse
})

Cypress.Commands.add('logoutUiAUI', () => {
    const log = Cypress.log({
        name: 'logoutUiAUI',
        displayName: 'LOGOUT UI (AUI)',
        message: '🚪',
        autoEnd: true
    })

    cy.get('button[data-cy=usermenu-btn]', quiet).click(quiet)
    cy.get('[data-cy=logout-btn]', quiet).click(quiet)
    cy.get('input[data-cy="aui-input-username"]').should('be.visible')
    cy.get('input[data-cy="aui-input-password"]').should('be.visible')
    cy.url(quiet).should((url) => {
        // NOTE: "should" does not support "{ log: false }" so it's a workaround for that
        const loginPageURL = /\/#\/login\/admin$/
        if (!loginPageURL.test(url)) {
            expect(url).to.match(loginPageURL)
        }
    })
    log.end()
})

Cypress.Commands.add('createAdminUI', (admin) => {
    cy.navigateMainMenu('settings / administrator')
    cy.locationShouldBe('#/administrator')
    cy.get('a[href="#/administrator/create"]').click()
    cy.locationShouldBe('#/administrator/create')
    cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'default', itemContains: 'default' })
    cy.get('input[data-cy="login-field"] ').type(admin.login)
    cy.get('input[data-cy="password-field"] ').type(admin.password)
    cy.get('input[data-cy="password-retype-field"] ').type(admin.password)
    cy.qSelect({ dataCy: 'roles-list', filter: admin.role, itemContains: admin.role })
    cy.get('[data-cy="aui-save-button"]').click()
    cy.get('div[role="alert"]').should('have.class', 'bg-positive')
})

export const apiLoginAsSuperuser = () => {
    return cy.AUIloginAPI('administrator', 'administrator').then(({ jwt }) => {
        return {
            headers: {
                authorization: `Bearer ${jwt}`
            }
        }
    })
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

export const apiRemoveAdminBy = ({ login, authHeader }) => {
    cy.log('apiRemoveAdminBy', login)
    if (!login) {
        return cy.log('apiRemoveAdminBy: login is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/admins`,
        qs: {
            login
        },
        ...authHeader
    }).then(({ body }) => {
        const adminId = body?._embedded?.['ngcp:admins']?.[0]?.id
        if (adminId) {
            cy.log('Deleting Admin...', login)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/admins/${adminId}`,
                ...authHeader
            })
        } else {
            return cy.log('Admin not found', login)
        }
    })
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

export const apiRemoveContractBy = ({ external_id, authHeader }) => {
    cy.log('apiRemoveContractBy', external_id)
    if (!external_id) {
        return cy.log('apiRemoveContractBy: external_id is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/contracts`,
        qs: {
            external_id
        },
        ...authHeader
    }).then(({ body }) => {
        const contractId = body?._embedded?.['ngcp:contracts']?.[0]?.id
        const contractStatus = body?._embedded?.['ngcp:contracts']?.[0]?.status
        if (contractId && contractStatus !== 'terminated') {
            cy.log('Terminating Contract...', external_id)
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
            return cy.log('Contract not found or already Terminated', external_id)
        }
    })
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

export const apiRemoveResellerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveResellerBy', name)
    if (!name) {
        return cy.log('apiRemoveResellerBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerId = body?._embedded?.['ngcp:resellers']?.[0]?.id
        const resellerStatus = body?._embedded?.['ngcp:resellers']?.[0]?.status
        if (resellerId && resellerStatus !== 'terminated') {
            cy.log('Terminating Reseller...', name)
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
            return cy.log('Reseller not found or aleady Terminated', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveDomainBy = ({ domain, authHeader }) => {
    cy.log('apiRemoveDomainBy', domain)
    if (!domain) {
        return cy.log('apiRemoveDomainBy: domain is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/domains`,
        qs: {
            domain
        },
        ...authHeader
    }).then(({ body }) => {
        const domainId = body?._embedded?.['ngcp:domains']?.[0]?.id
        if (domainId) {
            cy.log('Deleting Domain...', domain)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/domains/${domainId}`,
                ...authHeader
            })
        } else {
            return cy.log('Domain not found', domain)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
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
        return cy.log('Customer not found or already Terminated...', id)
    })
}

export const apiRemoveCustomerBy = ({ external_id, authHeader }) => {
    cy.log('apiRemoveCustomerBy', external_id)
    if (!external_id) {
        return cy.log('apiRemoveCustomerBy: external_id is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customers`,
        qs: {
            external_id,
            status: 'active,locked'
        },
        ...authHeader
    }).then(({ body }) => {
        const customers = body?._embedded?.['ngcp:customers']
        if (customers && customers.length > 0) {
            customers.forEach((customer) => {
                    cy.log(`Terminating customer ${customer.id}`, external_id)
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
            return cy.log('Customer not found or already Terminated', external_id)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveSubscriberBy = ({ username, authHeader }) => {
    cy.log('apiRemoveSubscriberBy', username)
    if (!username) {
        return cy.log('apiRemoveSubscriberBy: username is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscribers`,
        qs: {
            username
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberId = body?._embedded?.['ngcp:subscribers']?.[0]?.id
        if (subscriberId) {
            cy.log('Deleting Subscriber...', username)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscribers/${subscriberId}`,
                ...authHeader
            })
        } else {
            return cy.log('Subscriber not found', username)
        }
    })
}

export const apiCreateSubscriberPhonebook = ({ data, authHeader }) => {
    cy.log('apiCreateSubscriberPhonebook', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscriberphonebookentries/`,
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

export const apiRemoveSubscriberPhonebookBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberPhonebookBy', name)
    if (!name) {
        return cy.log('apiRemoveSubscriberPhonebookBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberphonebookentries`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const subscriberPhonebookId = body?._embedded?.['ngcp:subscriberphonebookentries']?.[0]?.id
        if (subscriberPhonebookId) {
            cy.log('Deleting Subscriber Phonebook...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberphonebookentries/${subscriberPhonebookId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Subscriber Phonebook found', name)
        }
    })
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

export const apiRemoveSystemContactBy = ({ email, authHeader }) => {
    cy.log('apiRemoveSystemContactBy', email)
    if (!email) {
        return cy.log('apiRemoveSystemContactBy: email is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/systemcontacts`,
        qs: {
            email
        },
        ...authHeader
    }).then(({ body }) => {
        const contactId = body?._embedded?.['ngcp:systemcontacts']?.[0]?.id
        if (contactId) {
            cy.log('Deleting System Contact...', email)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/systemcontacts/${contactId}`,
                ...authHeader
            })
        } else {
            return cy.log('System Contact not found', email)
        }
    })
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

export const apiRemoveCustomerContactsByIds = ({ ids, authHeader }) => {
    cy.log('apiRemoveCustomerContactsByIds', ids)
    ids.forEach((id) => {
        return cy.request({
            method: 'GET',
            url: `${ngcpConfig.apiHost}/api/customercontacts/${id}`,
            ...authHeader
        }).then(({ body }) => {
            if (body?.id) {
                cy.log('Deleting Customer Contact by id...', id)
                return cy.request({
                    method: 'DELETE',
                    url: `${ngcpConfig.apiHost}/api/customercontacts/${body.id}`,
                    ...authHeader
                })
            } else {
                return cy.log('Customer Contact not found', id)
            }
        })
    })
}

export const apiRemoveCustomerContactBy = ({ email, authHeader }) => {
    cy.log('apiRemoveCustomerContactBy', email)
    if (!email) {
        return cy.log('apiRemoveCustomerContactBy: email is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customercontacts`,
        qs: {
            email
        },
        ...authHeader
    }).then(({ body }) => {
        const contacts = body?._embedded?.['ngcp:customercontacts']
        if (contacts?.length) {
            cy.log('Deleting Customer Contact...', email)
            return contacts.forEach((contact) => {
                return cy.request({
                    method: 'DELETE',
                    url: `${ngcpConfig.apiHost}/api/customercontacts/${contact.id}`,
                    ...authHeader
                })
            })
        } else {
            return cy.log('Customer Contact not found', email)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveEmergencyMappingContainerBy = ({ name, authHeader }) => {
    cy.log('apiRemoveEmergencyMappingContainerBy', name)
    if (!name) {
        return cy.log('apiRemoveEmergencyMappingContainerBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const emergencyMappingContainerId = body?._embedded?.['ngcp:emergencymappingcontainers']?.[0]?.id
        if (emergencyMappingContainerId) {
            cy.log('Deleting Emergency Mapping Container...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappingcontainers/${emergencyMappingContainerId}`,
                ...authHeader
            })
        } else {
            return cy.log('Emergency Mapping Container not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveEmergencyMappingBy = ({ code, authHeader }) => {
    cy.log('apiRemoveEmergencyMappingBy', code)
    if (!code) {
        return cy.log('apiRemoveEmergencyMappingBy: code is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/emergencymappings`,
        qs: {
            code
        },
        ...authHeader
    }).then(({ body }) => {
        const emergencyMappingId = body?._embedded?.['ngcp:emergencymappings']?.[0]?.id
        if (emergencyMappingId) {
            cy.log('Deleting Emergency Mapping...', code)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emergencymappings/${emergencyMappingId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Emergency Mapping found')
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveSubscriberProfileSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberProfileSetBy', name)
    if (!name) {
        return cy.log('apiRemoveSubscriberProfileSetBy: name is required, skipping')
    }
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
            cy.log('Deleting Subscriber Profile Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofilesets/${subscriberProfileSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Subscriber Profile Set found')
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveResellerPhonebookBy = ({ name, authHeader }) => {
    cy.log('apiRemoveResellerPhonebookBy', name)
    if (!name) {
        return cy.log('apiRemoveResellerPhonebookBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/resellerphonebookentries`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const resellerPhonebookId = body?._embedded?.['ngcp:resellerphonebookentries']?.[0]?.id
        if (resellerPhonebookId) {
            cy.log('Deleting Reseller Phonebook...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/resellerphonebookentries/${resellerPhonebookId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Reseller Phonebook found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveBillingProfileBy = ({ name, authHeader }) => {
    cy.log('apiRemoveBillingProfileBy', name)
    if (!name) {
        return cy.log('apiRemoveBillingProfileBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingprofiles`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileId = body?._embedded?.['ngcp:billingprofiles']?.[0]?.id
        if (billingProfileId) {
            cy.log('Deleting Billing Profile...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingprofiles/${billingProfileId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing Profile not found', name)
        }
    })
}

export const apiCreateBillingNetwork = ({ data, authHeader }) => {
    cy.log('apiCreateBillingNetwork', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/billingnetworks/`,
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

export const apiRemoveBillingNetworkBy = ({ name, authHeader }) => {
    cy.log('apiRemoveBillingNetworkBy', name)
    if (!name) {
        return cy.log('apiRemoveBillingNetworkBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingnetworks`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const billingNetworkId = body?._embedded?.['ngcp:billingnetworks']?.[0]?.id
        if (billingNetworkId) {
            cy.log('Deleting Billing Network...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingnetworks/${billingNetworkId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing Network not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveBillingProfileZoneBy = ({ zone, authHeader }) => {
    cy.log('apiRemoveBillingProfileZoneBy', zone)
    if (!zone) {
        return cy.log('apiRemoveBillingProfileZoneBy: zone is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingzones`,
        qs: {
            zone
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileZoneId = body?._embedded?.['ngcp:billingzones']?.[0]?.id
        if (billingProfileZoneId) {
            cy.log('Deleting Billing Profile Zone...', zone)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingzones/${billingProfileZoneId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing Profile Zone not found', zone)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveBillingProfileFeeBy = ({ destination, authHeader }) => {
    cy.log('apiRemoveBillingProfileFeeBy', destination)
    if (!destination) {
        return cy.log('apiRemoveBillingProfileFeeBy: destination is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/billingfees`,
        qs: {
            destination
        },
        ...authHeader
    }).then(({ body }) => {
        const billingProfileFeeId = body?._embedded?.['ngcp:billingfees']?.[0]?.id
        if (billingProfileFeeId) {
            cy.log('Deleting Billing Profile Fee...', destination)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/billingfees/${billingProfileFeeId}`,
                ...authHeader
            })
        } else {
            return cy.log('Billing Profile Fee not found', destination)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveRewriteRuleSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveRewriteRuleSetBy', name)
    if (!name) {
        return cy.log('apiRemoveRewriteRuleSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRuleSetId = body?._embedded?.['ngcp:rewriterulesets']?.[0]?.id
        if (rewriteRuleSetId) {
            cy.log('Deleting Rewrite Rule Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterulesets/${rewriteRuleSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Rewrite Rule Set found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveRewriteRulesBy = ({ description, authHeader }) => {
    cy.log('apiRemoveRewriteRulesBy', description)
    if (!description) {
        return cy.log('apiRemoveRewriteRulesBy: description is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/rewriterules`,
        qs: {
            description
        },
        ...authHeader
    }).then(({ body }) => {
        const rewriteRulesId = body?._embedded?.['ngcp:rewriterules']?.[0]?.id
        if (rewriteRulesId) {
            cy.log('Deleting Rewrite Rules...', description)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/rewriterules/${rewriteRulesId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Rewrite Rules found', description)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveNCOSLevelBy = ({ level, authHeader }) => {
    cy.log('apiRemoveNCOSLevelBy', level)
    if (!level) {
        return cy.log('apiRemoveNCOSLevelBy: level is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncoslevels`,
        qs: {
            level
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSLevelId = body?._embedded?.['ngcp:ncoslevels']?.[0]?.id
        if (NCOSLevelId) {
            cy.log('Deleting NCOS Level...', level)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncoslevels/${NCOSLevelId}`,
                ...authHeader
            })
        } else {
            return cy.log('NCOS Level not found', level)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveNCOSPatternBy = ({ pattern, authHeader }) => {
    cy.log('apiRemoveNCOSPatternBy', pattern)
    if (!pattern) {
        return cy.log('apiRemoveNCOSPatternBy: pattern is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/ncospatterns`,
        qs: {
            pattern
        },
        ...authHeader
    }).then(({ body }) => {
        const NCOSPatternId = body?._embedded?.['ngcp:ncospatterns']?.[0]?.id
        if (NCOSPatternId) {
            cy.log('Deleting NCOS Pattern...', pattern)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/ncospatterns/${NCOSPatternId}`,
                ...authHeader
            })
        } else {
            return cy.log('NCOS Pattern not found', pattern)
        }
    })
}

export const apiCreateNCOSSet = ({ data, authHeader }) => {
    cy.log('apiCreateNCOSSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/v2/ncos/sets/`,
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

export const apiRemoveNCOSSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveNCOSSetBy', name)
    if (!name) {
        return cy.log('apiRemoveNCOSSetBy: name is required, skipping')
    }
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
                cy.log('Deleting NCOS Set...', name)
                return cy.request({
                    method: 'DELETE',
                    url: `${ngcpConfig.apiHost}/api/v2/ncos/sets/${set.id}`,
                    ...authHeader
                })
            })

        } else {
            return cy.log('NCOS Set not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveSoundSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSoundSetBy', name)
    if (!name) {
        return cy.log('apiRemoveSoundSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/soundsets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const soundSetId = body?._embedded?.['ngcp:soundsets']?.[0]?.id
        if (soundSetId) {
            cy.log('Deleting Sound Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/soundsets/${soundSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('Sound Set not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveLocationMappingBy = ({ external_id, authHeader }) => {
    cy.log('apiRemoveLocationMappingBy', external_id)
    if (!external_id) {
        return cy.log('apiRemoveLocationMappingBy: external_id is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings`,
        qs: {
            external_id
        },
        ...authHeader
    }).then(({ body }) => {
        const locationMappingId = body?._embedded?.['ngcp:subscriberlocationmappings']?.[0]?.id
        if (locationMappingId) {
            cy.log('Deleting Location Mapping...', external_id)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberlocationmappings/${locationMappingId}`,
                ...authHeader
            })
        } else {
            return cy.log('Location Mapping not found', external_id)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveSubscriberProfileBy = ({ name, authHeader }) => {
    cy.log('apiRemoveSubscriberProfileBy', name)
    if (!name) {
        return cy.log('apiRemoveSubscriberProfileBy: name is required, skipping')
    }
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
            cy.log('Deleting Subscriber Profile...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/subscriberprofiles/${subscriberProfileId}`,
                ...authHeader
            })
        } else {
            return cy.log('Subscriber Profile not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveTimesetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveTimesetBy', name)
    if (!name) {
        return cy.log('apiRemoveTimesetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/timesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const timesetId = body?._embedded?.['ngcp:timesets']?.[0]?.id
        if (timesetId) {
            cy.log('Deleting Timeset...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/timesets/${timesetId}`,
                ...authHeader
            })
        } else {
            return cy.log('Timeset not found', name)
        }
    })
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
        const id = body?._embedded?.['ngcp:profilepackages']?.[0]?.id
        return { id }
    })
}

export const apiRemoveProfilePackageBy = ({ name, authHeader }) => {
    cy.log('apiRemoveProfilePackageBy', name)
    if (!name) {
        return cy.log('apiRemoveProfilePackageBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/profilepackages`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const profilePackageId = body?._embedded?.['ngcp:profilepackages']?.[0]?.id
        if (profilePackageId) {
            cy.log('Deleting Profile Package...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/profilepackages/${profilePackageId}`,
                ...authHeader
            })
        } else {
            return cy.log('Profile Package not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveHeaderRulesetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveHeaderRulesetBy', name)
    if (!name) {
        return cy.log('apiRemoveHeaderRulesetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrulesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const headerRulesetID = body?._embedded?.['ngcp:headerrulesets']?.[0]?.id
        if (headerRulesetID) {
            cy.log('Deleting Header Rule Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerrulesets/${headerRulesetID}`,
                ...authHeader
            })
        } else {
            return cy.log('Header Rule Set not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveHeaderRuleBy = ({ name, authHeader }) => {
    cy.log('apiRemoveHeaderRuleBy', name)
    if (!name) {
        return cy.log('apiRemoveHeaderRuleBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerrules`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const headerRuleId = body?._embedded?.['ngcp:headerrules']?.[0]?.id
        if (headerRuleId) {
            cy.log('Deleting Header Rule...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerrules/${headerRuleId}`,
                ...authHeader
            })
        } else {
            return cy.log('Header Rule not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveHeaderRuleConditionBy = ({ match_name, authHeader }) => {
    cy.log('apiRemoveHeaderRuleConditionBy', match_name)
    if (!match_name) {
        return cy.log('apiRemoveHeaderRuleConditionBy: match_name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleconditions`,
        qs: {
            match_name
        },
        ...authHeader
    }).then(({ body }) => {
        const headerRuleConditionId = body?._embedded?.['ngcp:headerruleconditions']?.[0]?.id
        if (headerRuleConditionId) {
            cy.log('Deleting Header Rule Condition...', match_name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerruleconditions/${headerRuleConditionId}`,
                ...authHeader
            })
        } else {
            return cy.log('Header Rule Condition not found', match_name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveHeaderRuleActionBy = ({ header, authHeader }) => {
    cy.log('apiRemoveHeaderRuleActionBy', header)
    if (!header) {
        return cy.log('apiRemoveHeaderRuleActionBy: header is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/headerruleactions`,
        qs: {
            header
        },
        ...authHeader
    }).then(({ body }) => {
        const headerRuleActionId = body?._embedded?.['ngcp:headerruleactions']?.[0]?.id
        if (headerRuleActionId) {
            cy.log('Deleting Header Rule Action...', header)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/headerruleactions/${headerRuleActionId}`,
                ...authHeader
            })
        } else {
            return cy.log('Header Rule Action not found', header)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveLNPCarrierBy = ({ name, authHeader }) => {
    cy.log('apiRemoveLNPCarrierBy', name)
    if (!name) {
        return cy.log('apiRemoveLNPCarrierBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpcarriers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPCarrierID = body?._embedded?.['ngcp:lnpcarriers']?.[0]?.id
        if (LNPCarrierID) {
            cy.log('Deleting LNP Carrier...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/lnpcarriers/${LNPCarrierID}`,
                ...authHeader
            })
        } else {
            return cy.log('LNP Carrier not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemoveLNPNumberBy = ({ number, authHeader }) => {
    cy.log('apiRemoveLNPNumberBy', number)
    if (!number) {
        return cy.log('apiRemoveLNPNumberBy: number is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/lnpnumbers`,
        qs: {
            number
        },
        ...authHeader
    }).then(({ body }) => {
        const LNPNumberId = body?._embedded?.['ngcp:lnpnumbers']?.[0]?.id
        if (LNPNumberId) {
            cy.log('Deleting LNP Number...', number)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/lnpnumbers/${LNPNumberId}`,
                ...authHeader
            })
        } else {
            return cy.log('LNP Number not found', number)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePeeringGroupBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringGroupBy', name)
    if (!name) {
        return cy.log('apiRemovePeeringGroupBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringgroups`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const peeringGroupId = body?._embedded?.['ngcp:peeringgroups']?.[0]?.id
        if (peeringGroupId) {
            cy.log('Deleting Peering Group...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringgroups/${peeringGroupId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering Group not found', name)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePeeringInboundRuleBy = ({ group_id, authHeader }) => {
    cy.log('apiRemovePeeringInboundRuleBy', group_id)
    if (!group_id) {
        return cy.log('apiRemovePeeringInboundRuleBy: group_id is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringinboundrules`,
        qs: {
            group_id
        },
        ...authHeader
    }).then(({ body }) => {
        const peeringInboundRuleId = body?._embedded?.['ngcp:peeringinboundrules']?.[0]?.id
        if (peeringInboundRuleId) {
            cy.log('Deleting Peering Inbound Rule...', group_id)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringinboundrules/${peeringInboundRuleId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering Inbound Rule not found', group_id)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePeeringOutboundRuleBy = ({ description, authHeader }) => {
    cy.log('apiRemovePeeringOutboundRuleBy', description)
    if (!description) {
        return cy.log('apiRemovePeeringOutboundRuleBy: description is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringrules`,
        qs: {
            description
        },
        ...authHeader
    }).then(({ body }) => {
        const peeringOutboundRuleId = body?._embedded?.['ngcp:peeringrules']?.[0]?.id
        if (peeringOutboundRuleId) {
            cy.log('Deleting Peering Outbound Rule...', description)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringrules/${peeringOutboundRuleId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering Outbound Rule not found', description)
        }
    })
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
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePeeringServerBy = ({ name, authHeader }) => {
    cy.log('apiRemovePeeringServerBy', name)
    if (!name) {
        return cy.log('apiRemovePeeringServerBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/peeringservers`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const peeringServerId = body?._embedded?.['ngcp:peeringservers']?.[0]?.id
        if (peeringServerId) {
            cy.log('Deleting Peering Server...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/peeringservers/${peeringServerId}`,
                ...authHeader
            })
        } else {
            return cy.log('Peering Server not found', name)
        }
    })
}

export const apiCreatePbxDevice = ({ data, authHeader }) => {
    cy.log('apiCreatePbxDevice', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/pbxdevices/`,
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

export const apiRemovePbxDeviceBy = ({ station_name, authHeader }) => {
    cy.log('apiRemovePbxDeviceBy', station_name)
    if (!station_name) {
        return cy.log('apiRemovePbxDeviceBy: station_name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/pbxdevices`,
        qs: {
            station_name
        },
        ...authHeader
    }).then(({ body }) => {
        const pbxDeviceId = body?._embedded?.['ngcp:pbxdevices']?.[0]?.id
        if (pbxDeviceId) {
            cy.log('Deleting PBX Device...', station_name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/pbxdevices/${pbxDeviceId}`,
                ...authHeader
            })
        } else {
            return cy.log('PBX Device not found', station_name)
        }
    })
}

export const apiCreatePbxDeviceFirmware = ({ parameters, blobData, authHeader }) => {
    cy.log('apiCreatePbxDeviceFirmware', parameters)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/pbxdevicefirmwares/`,
        headers: {
            ...authHeader.headers,
            'Accept': 'application/octet-stream',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'content-type': 'application/octet-stream',
            'Prefer': 'return=representation'
        },
        qs: {
            device_id: parameters.device_id,
            version: parameters.version,
            tag: parameters.tag,
            filename: parameters.filename
        },
        body: 'message',
        data: blobData
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePbxDeviceFirmwareBy = ({ tag, authHeader }) => {
    cy.log('apiRemovePbxDeviceFirmwareBy', tag)
    if (!tag) {
        return cy.log('apiRemovePbxDeviceFirmwareBy: tag is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/pbxdevicefirmwares`,
        qs: {
            tag
        },
        ...authHeader
    }).then(({ body }) => {
        const pbxDeviceFirmwareId = body?._embedded?.['ngcp:pbxdevicefirmwares']?.[0]?.id
        if (pbxDeviceFirmwareId) {
            cy.log('Deleting PBX Firmware...', tag)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/pbxdevicefirmwares/${pbxDeviceFirmwareId}`,
                ...authHeader
            })
        } else {
            return cy.log('PBX Firmware not found', tag)
        }
    })
}

export const apiCreatePbxDeviceModel = ({ data, authHeader }) => {
    cy.log('apiCreatePbxDeviceModel', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/pbxdevicemodels/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'multipart/form-data'
        }
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePbxDeviceModelBy = ({ model, authHeader }) => {
    cy.log('apiRemovePbxDeviceModelBy', model)
    if (!model) {
        return cy.log('apiRemovePbxDeviceModelBy: model is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/pbxdevicemodels`,
        qs: {
            model
        },
        ...authHeader
    }).then(({ body }) => {
        const pbxDeviceModelId = body?._embedded?.['ngcp:pbxdevicemodels']?.[0]?.id
        if (pbxDeviceModelId) {
            cy.log('Deleting PBX Device Model...', model)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/pbxdevicemodels/${pbxDeviceModelId}`,
                ...authHeader
            })
        } else {
            return cy.log('PBX Device Model not found', model)
        }
    })
}

export const apiCreatePbxDeviceConfig = ({ parameters, data, authHeader }) => {
    cy.log('apiCreatePbxDeviceConfig', data, parameters)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/pbxdeviceconfigs/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'text/xml'
        },
        qs: {
            device_id: parameters.device_id,
            version: parameters.version
        },
    }).then(({ headers }) => {
        const id = headers?.location.split('/')[3]
        return { id }
    })
}

export const apiRemovePbxDeviceConfigBy = ({ version, authHeader }) => {
    cy.log('apiRemovePbxDeviceConfigBy', version)
    if (!version) {
        return cy.log('apiRemovePbxDeviceConfigBy: version is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/pbxdeviceconfigs`,
        qs: {
            version
        },
        ...authHeader
    }).then(({ body }) => {
        const pbxDeviceConfigId = body?._embedded?.['ngcp:pbxdeviceconfigs']?.[0]?.id
        if (pbxDeviceConfigId) {
            cy.log('Deleting PBX Device Config...', version)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/pbxdeviceconfigs/${pbxDeviceConfigId}`,
                ...authHeader
            })
        } else {
            return cy.log('PBX Device Config not found', version)
        }
    })
}

export const apiCreatePbxDeviceProfile = ({ data, authHeader }) => {
    cy.log('apiCreatePbxDeviceProfile', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/pbxdeviceprofiles/`,
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

export const apiRemovePbxDeviceProfileBy = ({ name, authHeader }) => {
    cy.log('apiRemovePbxDeviceProfileBy', name)
    if (!name) {
        return cy.log('apiRemovePbxDeviceProfileBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/pbxdeviceprofiles`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const pbxDeviceProfileId = body?._embedded?.['ngcp:pbxdeviceprofiles']?.[0]?.id
        if (pbxDeviceProfileId) {
            cy.log('Deleting PBX Device Profile...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/pbxdeviceprofiles/${pbxDeviceProfileId}`,
                ...authHeader
            })
        } else {
            return cy.log('PBX Device Profile not found', name)
        }
    })
}

export const apiCreateCFBnumberSet = ({ data, authHeader }) => {
    cy.log('apiCreateCFBnumberSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/cfbnumbersets/`,
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

export const apiRemoveCFBnumberSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCFBnumberSetBy', name)
    if (!name) {
        return cy.log('apiRemoveCFBnumberSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/cfbnumbersets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const cfBnumberSetId = body?._embedded?.['ngcp:cfbnumbersets']?.[0]?.id
        if (cfBnumberSetId) {
            cy.log('Deleting CF BNumber Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/cfbnumbersets/${cfBnumberSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No CF BNumber Set found', name)
        }
    })
}

export const apiCreateCFDestinationSet = ({ data, authHeader }) => {
    cy.log('apiCreateCFDestinationSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/cfdestinationsets/`,
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

export const apiRemoveCFDestinationSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCFDestinationSetBy', name)
    if (!name) {
        return cy.log('apiRemoveCFDestinationSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/cfdestinationsets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const cfBDestinationSetId = body?._embedded?.['ngcp:cfdestinationsets']?.[0]?.id
        if (cfBDestinationSetId) {
            cy.log('Deleting CF Destination Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/cfdestinationsets/${cfBDestinationSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No CF Destination Set found', name)
        }
    })
}

export const apiCreateCFSourceSet = ({ data, authHeader }) => {
    cy.log('apiCreateCFSourceSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/cfsourcesets/`,
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

export const apiRemoveCFSourceSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCFSourceSetBy', name)
    if (!name) {
        return cy.log('apiRemoveCFSourceSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/cfsourcesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const cfSourceSetId = body?._embedded?.['ngcp:cfsourcesets']?.[0]?.id
        if (cfSourceSetId) {
            cy.log('Deleting CF Source Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/cfsourcesets/${cfSourceSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No CF Source Set found', name)
        }
    })
}

export const apiCreateCFTimeSet = ({ data, authHeader }) => {
    cy.log('apiCreateCFTimeSet', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/cftimesets/`,
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

export const apiRemoveCFTimeSetBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCFTimeSetBy', name)
    if (!name) {
        return cy.log('apiRemoveCFTimeSetBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/cftimesets`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const cfTimeSetId = body?._embedded?.['ngcp:cftimesets']?.[0]?.id
        if (cfTimeSetId) {
            cy.log('Deleting CF Time Set...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/cftimesets/${cfTimeSetId}`,
                ...authHeader
            })
        } else {
            return cy.log('No CF Time Set found', name)
        }
    })
}

export const apiPutCFMappingByID = ({ id, data, authHeader }) => {
    cy.log('Patching CFMapping of subscriber ID...', id)
    return cy.request({
        method: 'PUT',
        url: `${ngcpConfig.apiHost}/api/cfmappings/${id}`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    })
}

export const apiCreateEmailTemplate = ({ data, authHeader }) => {
    cy.log('apiCreateEmailTemplate', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/emailtemplates/`,
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

export const apiRemoveEmailTemplateBy = ({ name, authHeader }) => {
    cy.log('apiRemoveEmailTemplateBy', name)
    if (!name) {
        return cy.log('apiRemoveEmailTemplateBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/emailtemplates`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const emailTemplateId = body?._embedded?.['ngcp:emailtemplates']?.[0]?.id
        if (emailTemplateId) {
            cy.log('Deleting Email Template...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/emailtemplates/${emailTemplateId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Email Template found', name)
        }
    })
}

export const apiCreateBillingVoucher = ({ data, authHeader }) => {
    cy.log('apiCreateBillingVoucher', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/vouchers/`,
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

export const apiRemoveBillingVoucherByResellerId = ({ reseller_id, authHeader, code }) => {
    cy.log('apiRemoveBillingVoucherByResellerId', code)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/vouchers`,
        qs: {
            order_by: 'created_at',
            order_by_direction: 'desc',
            page: 1,
            rows:100,
            reseller_id
        },
        ...authHeader
    }).then(({ body }) => {
        const billingVouchers = body?._embedded?.['ngcp:vouchers']
        const billingVoucher = billingVouchers ? billingVouchers.find(voucher => voucher?.code === code) : null
        if (billingVoucher) {
            cy.log('Deleting Billing Voucher...', billingVoucher.code)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/vouchers/${billingVoucher.id}`,
                ...authHeader
            })
        } else {
            return cy.log('No Billing Vouchers found', code)
        }
    })
}

export const apiRemoveBillingVoucherByPackageId = ({package_id, authHeader, code }) => {
    cy.log('apiRemoveBillingVoucherByPackageId', code)
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/vouchers`,
        qs: {
            order_by: 'created_at',
            order_by_direction: 'desc',
            page: 1,
            rows:100,
            package_id
        },
        ...authHeader
    }).then(({ body }) => {
        const billingVouchers = body?._embedded?.['ngcp:vouchers']
        const billingVoucher = billingVouchers ? billingVouchers.find(voucher => voucher?.code === code) : null
        if (billingVoucher) {
            cy.log('Deleting Billing Voucher...', billingVoucher.code)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/vouchers/${billingVoucher.id}`,
                ...authHeader
            })
        } else {
            return cy.log('No Billing Vouchers found', code)
        }
    })
}

export const apiCreateCustomerLocation = ({ data, authHeader }) => {
    cy.log('apiCreateCustomerLocation', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/customerlocations/`,
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

export const apiRemoveCustomerLocationBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCustomerLocationBy', name)
    if (!name) {
        return cy.log('apiRemoveCustomerLocationBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customerlocations`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const customerLocationId = body?._embedded?.['ngcp:customerlocations']?.[0]?.id
        if (customerLocationId) {
            cy.log('Deleting Customer Locations...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/customerlocations/${customerLocationId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Customer Locations found', name)
        }
    })
}

export const apiCreateCustomerPhonebook = ({ data, authHeader }) => {
    cy.log('apiCreateCustomerPhonebook', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/customerphonebookentries/`,
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

export const apiRemoveCustomerPhonebookBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCustomerPhonebookBy', name)
    if (!name) {
        return cy.log('apiRemoveCustomerPhonebookBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/customerphonebookentries`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const customerPhonebookId = body?._embedded?.['ngcp:customerphonebookentries']?.[0]?.id
        if (customerPhonebookId) {
            cy.log('Deleting Customer Phonebook...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/customerphonebookentries/${customerPhonebookId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Customer Phonebook found', name)
        }
    })
}

export const apiEditCustomerSpeeddial = ({ data, authHeader }) => {
    cy.log('apiEditCustomerSpeeddial', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/v2/customerspeeddials/`,
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

export const apiEditSubscriberSpeeddial = ({ subid, data, authHeader }) => {
    cy.log('apiEditSubscriberSpeeddial', data)
    return cy.request({
        method: 'PUT',
        url: `${ngcpConfig.apiHost}/api/speeddials/${subid}`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    })
}

export const apiEditAutoAttendant = ({ subid, data, authHeader }) => {
    cy.log('apiEditAutoAttendant', data)
    return cy.request({
        method: 'PUT',
        url: `${ngcpConfig.apiHost}/api/autoattendants/${subid}`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
    })
}

export const apiCreateCallListSuppression = ({ data, authHeader }) => {
    cy.log('apiCreateCallListSuppression', data)
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/calllistsuppressions/`,
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

export const apiRemoveCallListSuppressionBy = ({ name, authHeader }) => {
    cy.log('apiRemoveCallListSuppressionBy', name)
    if (!name) {
        return cy.log('apiRemoveCallListSuppressionBy: name is required, skipping')
    }
    return cy.request({
        method: 'GET',
        url: `${ngcpConfig.apiHost}/api/calllistsuppressions`,
        qs: {
            name
        },
        ...authHeader
    }).then(({ body }) => {
        const callListSuppressionId = body?._embedded?.['ngcp:calllistsuppressions']?.[0]?.id
        if (callListSuppressionId) {
            cy.log('Deleting Call List Suppression...', name)
            return cy.request({
                method: 'DELETE',
                url: `${ngcpConfig.apiHost}/api/calllistsuppressions/${callListSuppressionId}`,
                ...authHeader
            })
        } else {
            return cy.log('No Call List Suppression found', name)
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

export const getRandomNum = (maxLength = 5) => Math.floor((Math.random() * Math.pow(10, maxLength)))

export const waitPageProgressAUI = () => {
    cy.get('div[class="q-linear-progress"][role="progressbar"]').should('exist')
    cy.get('div[class="q-linear-progress"][role="progressbar"]', {timeout: 20000}).should('not.exist')
}

export const waitPageProgressCSC = () => {
    cy.get('div[id="csc-page-main"] svg[data-cy="q-spinner-dots"]').should('exist')
    cy.get('div[id="csc-page-main"] svg[data-cy="q-spinner-dots"]', {timeout: 20000}).should('not.exist')
}

export const searchInDataTable = (searchText, searchCriteria = null, waitPageProgressCheck = true) => {
    cy.get('label[data-cy="aui-data-table-filter-criteria"]', {timeout: 20000}).should('be.visible')
    cy.get('label[data-cy="aui-data-table-filter-criteria"][aria-disabled="true"]', {timeout: 20000}).should('not.exist')
    if (searchCriteria !== null) {
        cy.qSelect({ dataCy: 'aui-data-table-filter-criteria', filter: '', itemContains: searchCriteria })
        cy.get('label[data-cy="aui-input-search--datatable"][aria-disabled="true"]', {timeout: 20000}).should('not.exist')
    }
    cy.get('input[data-cy="aui-input-search--datatable"]').clear()
    cy.get('input[data-cy="aui-input-search--datatable"]').type(searchText)
    if (waitPageProgressCheck) {
        waitPageProgressAUI()
    }
}

export const deleteItemOnListPageBy = (searchText = null, searchCriteria = null) => {
    if (searchText !== null) {
        searchInDataTable(searchText, searchCriteria)
    }
    cy.get('td[data-cy="q-td--more-menu-left"]').click()
    cy.get('div[data-cy="aui-data-table-row-menu--delete"]').click()
    cy.get('[data-cy="btn-confirm"]').click()
    if (searchText !== null) {
        cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
    } else {
        cy.contains('.q-table__bottom--nodata', 'No data available').should('be.visible')
    }
}

export const clickDataTableSelectedMoreMenuItem = (actionName) => {
    cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').as('btn')
    cy.get('@btn').click()
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
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
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
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('input').type(value)
    cy.get('button[data-cy="preference-save"]').click()
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
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
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('label[aria-disabled="true"]').should('not.exist')
}

export const testPreferencesToggleField = (name) => {
    const { dataCySelector, cyAliasName } = getPreferencesFieldInfo(name)
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('div[role=switch]').click()
    cy.get(dataCySelector).should('be.visible').as(cyAliasName)
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=switch]').invoke('attr', 'aria-checked').should('eq', 'true')
    cy.get('@' + cyAliasName).find('div[role=switch]').click()
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
    cy.get('@' + cyAliasName).find('div[role=switch]').invoke('attr', 'aria-checked').should('eq', 'false')
    cy.get('@' + cyAliasName).find('div[role=switch][aria-disabled="true"]').should('not.exist')
}
