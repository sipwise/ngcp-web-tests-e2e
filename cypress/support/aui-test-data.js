import { getRandomNum } from "./ngcp-admin-ui/e2e";

export const domain = {
    reseller_id: 1,
    domain: 'domainCypress'
}

export const subscriber = {
    username: 'subscriberCypressAui',
    email: 'subscriberCypressAui@test.com',
    external_id: 'subid' + getRandomNum(),
    password: 'suB#' + getRandomNum() + '#PaSs#',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: getRandomNum(4)
    },
}

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractCypress',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const dependencyContract = {
    contact_id: null,
    status: 'active',
    external_id: 'dependencyContractCypress',
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: `customerCypress`,
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const customerPbx = {
    billing_profile_definition: 'id',
    billing_profile_id: null,
    external_id: 'customerPbxCypress',
    contact_id: null,
    status: 'active',
    type: 'pbxaccount',
    customer_id: null
}

export const reseller = {
    contract_id: 1,
    status: 'active',
    rtc_networks: {},
    name: 'resellerCypress',
    enable_rtc: false
}