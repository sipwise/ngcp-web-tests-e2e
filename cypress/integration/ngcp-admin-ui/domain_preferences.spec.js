/// <reference types="cypress" />

import {
    getRandomNum,
    waitPageProgress,
    clickDataTableSelectedMoreMenuItem,
    searchInDataTable,
    testPreferencesToggleField,
    testPreferencesListField,
    testPreferencesChipField,
    testPreferencesTextField
} from '../../support/ngcp-admin-ui/utils/common'

import {
    apiCreateContract,
    apiCreateDomain,
    apiCreateEmergencyMappingContainer,
    apiCreateNCOSLevel,
    apiCreateReseller,
    apiCreateRewriteRuleSet,
    apiCreateSoundSet,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveContractBy,
    apiRemoveDomainBy,
    apiRemoveEmergencyMappingContainerBy,
    apiRemoveNCOSLevelBy,
    apiRemoveResellerBy,
    apiRemoveRewriteRuleSetBy,
    apiRemoveSoundSetBy,
    apiRemoveSystemContactBy
} from '../../support/ngcp-admin-ui/utils/api'

const ngcpConfig = Cypress.config('ngcpConfig')

const domain = {
    reseller_id: null,
    domain: 'domain' + getRandomNum()
}

const dependencyReseller = {
    contract_id: null,
    status: 'active',
    name: 'reseller' + getRandomNum(),
    enable_rtc: false
}

const systemContactDependency = {
    email: 'contact' + getRandomNum() + '@example.com'
}

const dependencyContract = {
    contact_id: null,
    status: 'active',
    external_id: 'contract' + getRandomNum(),
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const emergencyMappingContainer = {
    name: 'emergency' + getRandomNum(),
    reseller_id: null
}

const ncosLevel = {
    reseller_id: null,
    level: 'ncoslevel' + getRandomNum(),
    mode: 'whitelist',
    description: 'description' + getRandomNum()
}

const soundSet = {
    name: 'soundset' + getRandomNum(),
    description: 'description' + getRandomNum(),
    reseller_id: null
}

const rewriteRuleSet = {
    name: 'ruleset ' + getRandomNum(),
    description: 'description' + getRandomNum(),
    reseller_id: null
}

context('Domain preferences tests', () => {
    context('UI domain preferences tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateSystemContact({ data: systemContactDependency, authHeader }).then(({ id }) => {
                    apiCreateContract({ data: { ...dependencyContract, contact_id: id }, authHeader }).then(({ id }) => {
                        apiCreateReseller({ data: { ...dependencyReseller, contract_id: id }, authHeader }).then(({ id }) => {
                            domain.reseller_id = id
                            apiCreateSoundSet({ data: { ...soundSet, reseller_id: id }, authHeader })
                            apiCreateEmergencyMappingContainer({ data: { ...emergencyMappingContainer, reseller_id: id }, authHeader })
                            apiCreateNCOSLevel({ data: { ...ncosLevel, reseller_id: id }, authHeader })
                            apiCreateRewriteRuleSet({ data: { ...rewriteRuleSet, reseller_id: id }, authHeader })
                        })
                    })
                })
            })
        })

        beforeEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiCreateDomain({ data: domain, authHeader })
            })
        })

        after(() => {
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
                apiRemoveNCOSLevelBy({ name: ncosLevel.level, authHeader })
                apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
                apiRemoveResellerBy({ name: dependencyReseller.name, authHeader })
                apiRemoveContractBy({ name: dependencyContract.external_id, authHeader })
                apiRemoveSystemContactBy({ name: systemContactDependency.email, authHeader })
            })
        })

        afterEach(() => {
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
            })
        })

        it('Test all Access Restricion settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Access Restrictions', itemContains: 'Access Restrictions' })
            testPreferencesToggleField('allow_out_foreign_domain')
            testPreferencesListField('allowed_clis_reject_policy', 'Force CLIR')
            testPreferencesChipField('allowed_ips', { value1: '10.0.0.1', value2: '10.0.0.10' }, true)
            testPreferencesChipField('allowed_ips', { value1: '2345:0425:2CA1:0000:0000:0567:5673:23B5', value2: 'AAAA:BBBB:CCCC:DDDD:EEEE:FFFF:0000:1111' })
            testPreferencesTextField('allowed_ips_header')
            testPreferencesListField('calllist_clir_scope', 'All')
            testPreferencesTextField('concurrent_max', 123, true)
            testPreferencesTextField('concurrent_max_in', 123, true)
            testPreferencesTextField('concurrent_max_in_per_account', 123, true)
            testPreferencesTextField('concurrent_max_in_total', 123, true)
            testPreferencesTextField('concurrent_max_out', 123, true)
            testPreferencesTextField('concurrent_max_out_per_account', 123, true)
            testPreferencesTextField('concurrent_max_out_total', 123, true)
            testPreferencesTextField('concurrent_max_per_account"]', 123, true)
            testPreferencesTextField('concurrent_max_total', 123, true)
            testPreferencesToggleField('count_callforward_as_one')
            testPreferencesToggleField('ignore_allowed_ips')
            testPreferencesChipField('man_allowed_ips', { value1: '10.0.0.1', value2: '10.0.0.10' }, true)
            testPreferencesTextField('max_call_duration', 123)
            testPreferencesToggleField('reject_emergency')
            testPreferencesToggleField('reject_vsc')
            testPreferencesToggleField('softphone_autoprov')
            testPreferencesChipField('ua_filter_list')
            testPreferencesToggleField('ua_filter_mode"]')
            testPreferencesToggleField('ua_reject_missing"]')
            testPreferencesToggleField('unauth_inbound_calls"]')
        })

        it('Test all Application settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Applications', itemContains: 'Applications' })
            testPreferencesListField('callrecording_type', 'External')
            testPreferencesToggleField('malicious_call_identification')
            testPreferencesToggleField('party_call_control')
            testPreferencesToggleField('play_announce_before_call_setup')
            testPreferencesToggleField('play_announce_before_cf')
            testPreferencesListField('play_announce_before_recording', 'External calls only')
            testPreferencesToggleField('play_announce_to_callee')
            testPreferencesToggleField('play_emulated_ringback_tone')
        })

        it('Test all Call Blocking settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Call Blockings', itemContains: 'Call Blockings' })
            testPreferencesListField('adm_cf_ncos', ncosLevel.level)
            testPreferencesListField('adm_ncos', ncosLevel.level)
            testPreferencesListField('ncos', ncosLevel.level)
        })

        it('Test all IMS application server settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'IMS Application Server', itemContains: 'IMS Application Server' })
            testPreferencesToggleField('ims_as_context')
        })

        it('Test all Internal settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Internal', itemContains: 'Internal' })
            cy.get('label[data-cy="aui-input-search"] input').type('a')
            testPreferencesListField('accept_auto_answer', 'No')
            testPreferencesListField('advice_of_charge', 'Currency')
            testPreferencesListField('alert_info_type', 'internal_external')
            testPreferencesTextField('alert_info_url')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('c')
            testPreferencesListField('call_deflection', 'Disabled')
            testPreferencesTextField('concurrent_calls_quota', 123)
            testPreferencesTextField('conference_max_participants', 123)
            testPreferencesTextField('contact_ringtimeout', 123)
            cy.get('label[data-cy="aui-input-search"] input').clear().type('d')
            testPreferencesTextField('default_lnp_prefix')
            testPreferencesToggleField('disable_prack_method')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('e')
            testPreferencesToggleField('emergency_mode_enabled')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('f')
            testPreferencesListField('force_inbound_calls_to_peer', 'Always')
            testPreferencesListField('force_outbound_calls_to_peer', 'Always')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('i')
            testPreferencesTextField('identifier')
            testPreferencesTextField('ip_header')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('l')
            testPreferencesListField('language', 'German')
            testPreferencesToggleField('last_number_redial')
            testPreferencesToggleField('lcr_peer_cf')
            testPreferencesToggleField('lnp_add_npdi')
            testPreferencesToggleField('lnp_for_local_sub')
            testPreferencesToggleField('lnp_to_rn')
            testPreferencesToggleField('lookup_all_registrations')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('m')
            testPreferencesListField('mobile_push_enable', 'Send push only if no device registered')
            testPreferencesTextField('mobile_push_expiry', 123)
            cy.get('label[data-cy="aui-input-search"] input').clear().type('prepaid_library')
            testPreferencesListField('prepaid_library', 'libinewrate')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('r')
            testPreferencesToggleField('recent_calls_by_upn')
            testPreferencesChipField('rerouting_codes', { value1: '123', value2: '54321' })
            cy.get('label[data-cy="aui-input-search"] input').clear().type('s')
            testPreferencesListField('serial_forking_by_q_value', 'Standard')
            testPreferencesListField('smsc_peer', 'default')
            testPreferencesToggleField('stir_check')
            testPreferencesTextField('stir_pub_url')
            testPreferencesChipField('stop_forking_code_lists', { value1: '123', value2: '54321' })
            testPreferencesListField('support_auto_answer"]', 'If provided by phone')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('u')
            testPreferencesListField('ua_header_mode', 'Replace')
            testPreferencesTextField('ua_header_replace"]')
        })

        it('Test all Media Codec Transcoding Options settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Media Codec Transcoding Options', itemContains: 'Media Codec Transcoding Options' })
            cy.get('label[data-cy="aui-input-search"] input').clear().type('a')
            testPreferencesTextField('AMR_CMR_interval', 123, true)
            testPreferencesTextField('AMR_WB_CMR_interval', 123, true)
            testPreferencesListField('AMR_WB_bitrate', '23.85 kbit/s (mode 8)')
            testPreferencesListField('AMR_WB_mode_change_capability', '2')
            testPreferencesTextField('AMR_WB_mode_change_interval', 123, true)
            testPreferencesToggleField('AMR_WB_mode_change_neighbor')
            testPreferencesListField('AMR_WB_mode_change_period', '2')
            testPreferencesTextField('AMR_WB_mode_set')
            testPreferencesToggleField('AMR_WB_octet_align')
            testPreferencesListField('AMR_bitrate', '12.2 kbit/s (mode 7)')
            testPreferencesListField('AMR_mode_change_capability', '2')
            testPreferencesTextField('AMR_mode_change_interval', 123, true)
            testPreferencesToggleField('AMR_mode_change_neighbor')
            testPreferencesListField('AMR_mode_change_period', '2')
            testPreferencesTextField('AMR_mode_set')
            testPreferencesToggleField('AMR_octet_align')
            testPreferencesToggleField('always_transcode')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('c')
            testPreferencesToggleField('convert_dtmf_info')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('g')
            testPreferencesListField('g723_bitrate', '6.3 kbit/s')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('o')
            testPreferencesListField('opus_mono_bitrate', '32 kbit/s')
            testPreferencesListField('opus_stereo_bitrate', '32 kbit/s')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('p')
            testPreferencesListField('ptime', '60 ms')
            cy.get('label[data-cy="aui-input-search"] input').clear().type('t')
            testPreferencesToggleField('T38_FEC')
            testPreferencesToggleField('T38_decode')
            testPreferencesToggleField('T38_force')
            testPreferencesToggleField('T38_no_ECM')
            testPreferencesToggleField('T38_no_IAF')
            testPreferencesToggleField('T38_no_V17')
            testPreferencesToggleField('T38_no_V27ter')
            testPreferencesToggleField('T38_no_V29')
            testPreferencesToggleField('T38_no_V34')
            testPreferencesToggleField('transcode_AMR')
            testPreferencesToggleField('transcode_AMR_WB')
            testPreferencesToggleField('transcode_G722')
            testPreferencesToggleField('transcode_G723')
            testPreferencesToggleField('transcode_G729')
            testPreferencesToggleField('transcode_GSM')
            testPreferencesToggleField('transcode_PCMA')
            testPreferencesToggleField('transcode_PCMU')
            testPreferencesToggleField('transcode_cn')
            testPreferencesToggleField('transcode_dtmf')
            testPreferencesToggleField('transcode_opus_mono')
            testPreferencesToggleField('transcode_opus_stereo')
            testPreferencesToggleField('transcode_speex_16')
            testPreferencesToggleField('transcode_speex_32')
            testPreferencesToggleField('transcode_speex_8')
        })

        it('Test all NAT and Media Flow Control settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'NAT and Media Flow Control', itemContains: 'NAT and Media Flow Control' })
            testPreferencesListField('DTLS_fingerprint', 'SHA-1')
            testPreferencesToggleField('ICE_lite')
            testPreferencesToggleField('OSRTP_offer')
            testPreferencesToggleField('announce_error_codes_enable')
            testPreferencesChipField('announce_error_codes_list')
            testPreferencesListField('bypass_rtpproxy', 'Never')
            testPreferencesToggleField('codecs_filter')
            testPreferencesToggleField('codecs_id_filter')
            testPreferencesTextField('codecs_id_list')
            testPreferencesTextField('codecs_list')
            testPreferencesToggleField('generate_rtcp')
            testPreferencesListField('ipv46_for_rtpproxy', 'Force IPv4')
            testPreferencesListField('lbrtp_set', 'default')
            testPreferencesListField('nat_sipping', 'No')
            testPreferencesToggleField('original_sendrecv')
            testPreferencesToggleField('record_call')
            testPreferencesToggleField('rtp_debug')
            testPreferencesListField('rtp_interface', 'ext')
            testPreferencesToggleField('sdp_crypto_base64_padding')
            testPreferencesToggleField('set_moh_sendonly')
            testPreferencesToggleField('set_moh_zeroconnection')
            testPreferencesToggleField('single_codec')
            testPreferencesListField('sound_set', soundSet.name)
            testPreferencesListField('transport_protocol', 'RTP/AVP (plain RTP)')
            testPreferencesListField('use_rtpproxy', 'Never')
        })

        it('Test all Number Manipulations settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Number Manipulations', itemContains: 'Number Manipulations' })
            testPreferencesToggleField('colp_cf')
            testPreferencesListField('emergency_mapping_container', emergencyMappingContainer.name)
            testPreferencesListField('emergency_upn', 'User-Provided-Number')
            testPreferencesListField('extended_dialing_mode', 'Strict number matching')
            testPreferencesToggleField('extension_in_npn')
            testPreferencesToggleField('force_outb_call_uses_peer_hdrs')
            testPreferencesListField('inbound_upn', 'From-Displayname')
            testPreferencesListField('inbound_uprn', "Forwarder's UPN")
            testPreferencesToggleField('no_404_fallback')
            testPreferencesListField('outbound_diversion', 'UPRN')
            testPreferencesListField('outbound_from_display', 'Authentication-User')
            testPreferencesListField('outbound_from_user', 'Authentication-User')
            testPreferencesToggleField('outbound_from_user_is_phone')
            testPreferencesListField('outbound_history_info', 'UPRN')
            testPreferencesListField('outbound_pai_display', 'Authentication-User')
            testPreferencesListField('outbound_pai_user', 'Authentication-User')
            testPreferencesListField('outbound_ppi_user', 'Authentication-User')
            testPreferencesListField('outbound_to_user', 'Received To header')
            testPreferencesToggleField('outbound_from_user_is_phone')
            testPreferencesListField('rewrite_rule_set', rewriteRuleSet.name)
            testPreferencesListField('skip_upn_check_on_diversion', 'If received Diversion header')
        })

        it('Test all Remote Authentication settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Remote Authentication', itemContains: 'Remote Authentication' })
            testPreferencesToggleField('peer_auth_register')
        })

        it('Test all Session Timers settings in domain', () => {
            cy.login(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain-list')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domain-preferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Session Timers', itemContains: 'Session Timers' })
            testPreferencesListField('sst_enable', 'yes')
            testPreferencesTextField('sst_expires', 123, true)
            testPreferencesTextField('sst_max_timer', 123, true)
            testPreferencesTextField('sst_min_timer', 123, true)
            // testPreferencesListField('sst_refresh_method', 'INVITE')
        })
    })
})