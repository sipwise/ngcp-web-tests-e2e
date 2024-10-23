import { getRandomNum } from "./ngcp-csc-ui/e2e";

export const domain = {
    domain: 'domainCypressCsc',
    reseller_id: 1
}

export const subscriber = {
    username: 'subscriberCypressCsc',
    webusername: 'subscriberCypressCsc',
    email: 'subscriberCypressCsc@test.com',
    external_id: 'subidsubscriberCypressCsc1',
    password: 'sub' + getRandomNum() + 'pass',
    webpassword: 'sub' + getRandomNum() + 'pass',
    domain: domain.domain,
    customer_id: 0,
    subscriber_id: 0,
    primary_number: {
        sn: 11,
        ac: 22,
        cc: 1111
    },
}

export const customer = {
    billing_profile_definition: 'id',
    billing_profile_id: 1,
    external_id: 'customerCypressCsc',
    contact_id: 1,
    status: 'active',
    type: 'sipaccount'
}

export const loginInfo = {
    username: `${subscriber.webusername}@${subscriber.domain}`,
    password: `${subscriber.webpassword}`
}
