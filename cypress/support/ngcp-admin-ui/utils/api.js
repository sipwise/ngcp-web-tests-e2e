
const ngcpConfig = Cypress.config('ngcpConfig')

export const apiLoginAsSuperuser = () => {
    return cy.loginAPI('administrator', 'administrator').then(({ jwt }) => {
        return {
            headers: {
                authorization: `Bearer ${jwt}`
            }
        }
    })
}

export const apiRemoveAdminBy = ({ name, authHeader }) => {
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
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/contracts`,
        body: data,
        ...authHeader
        // followRedirect: false
    }).then(({ body }) => {
        const contractData = (body?._embedded?.['ngcp:contracts'] || []).pop()
        return contractData || {}
    })
}

export const apiRemoveContractBy = ({ name, authHeader }) => {
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
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/resellers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ body }) => {
        const resellersData = (body?._embedded?.['ngcp:resellers'] || []).pop()
        return resellersData || {}
    })
}

export const apiRemoveResellerBy = ({ name, authHeader }) => {
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
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/domains/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ body }) => {
        const resellersData = (body?._embedded?.['ngcp:domains'] || []).pop()
        return resellersData || {}
    })
}

export const apiRemoveDomainBy = ({ name, authHeader }) => {
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
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/customers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ body }) => {
        const customerData = (body?._embedded?.['ngcp:customers'] || []).pop()
        return customerData || {}
    })
}

export const apiGetCustomerId = ({ name, authHeader }) => {
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
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/subscribers/`,
        body: data,
        headers: {
            ...authHeader.headers,
            'content-type': 'application/json'
        }
        // followRedirect: false
    }).then(({ body }) => {
        const subscriberData = (body?._embedded?.['ngcp:subscribers'] || []).pop()
        return subscriberData || {}
    })
}

export const apiGetSubscriberId = ({ name, authHeader }) => {
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
