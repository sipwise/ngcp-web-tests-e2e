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
