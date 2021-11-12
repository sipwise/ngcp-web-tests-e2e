
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

export const defaultResellerCreationData = {
    name: '',
    contract_id: 0,
    status: 'active',
    enable_rtc: false
}

export const apiCreateReseller = ({ data, authHeader }) => {
    return cy.request({
        method: 'POST',
        url: `${ngcpConfig.apiHost}/api/resellers`,
        body: data,
        ...authHeader
        // followRedirect: false
    }).then(({ body }) => {
        const resellersData = (body?._embedded?.['ngcp:resellers'] || []).pop()
        return resellersData || {}
    })
}
