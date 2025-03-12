/// <reference types="cypress" />

import {
    waitPageProgress,
    clickDataTableSelectedMoreMenuItem,
    searchInDataTable,
    testPreferencesToggleField,
    testPreferencesListField,
    testPreferencesChipField,
    testPreferencesTextField,
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
} from '../../support/ngcp-admin-ui/e2e'

const ngcpConfig = Cypress.config('ngcpConfig')

export const dependencyContract = {
    contact_id: null,
    status: 'active',
    external_id: 'dependencyContractDomainPref',
    type: 'sippeering',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

const dependencyReseller = {
    contract_id: null,
    status: 'active',
    name: 'dependencyDomainPref',
    enable_rtc: false
}

export const domain = {
    reseller_id: 1,
    domain: 'domainCypress'
}


const emergencyMappingContainer = {
    name: 'emergencyMCCDomainPref',
    reseller_id: null
}

const ncosLevel = {
    reseller_id: null,
    level: 'ncosLevelDomainPref',
    mode: 'whitelist',
    description: 'This is a description of ncosLevelDomainPref'
}

const soundSet = {
    name: 'soundsetDomainPref',
    description: 'This is a description of soundsetDomainPref',
    reseller_id: null
}

const rewriteRuleSet = {
    name: 'rulesetDomainPref',
    description: 'This is a description of rewriteRuleSet',
    reseller_id: null
}

const systemContactDependency = {
    email: 'systemContactDependencyDomainPref@example.com'
}

context('Domain preferences tests', () => {
    context('UI domain preferences tests', () => {
        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            apiLoginAsSuperuser().then(authHeader => {
                Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                cy.log('Preparing environment...')
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveNCOSLevelBy({ name: ncosLevel.level, authHeader })
                apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
                apiRemoveResellerBy({ name: dependencyReseller.name, authHeader })
                apiRemoveContractBy({ name: dependencyContract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
                cy.log('Data clean up pre-tests completed')

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
                cy.log('Cleaning up db...')
                apiRemoveDomainBy({ name: domain.domain, authHeader })

                cy.log('Seeding db...')
                apiCreateDomain({ data: domain, authHeader })
            })
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            apiLoginAsSuperuser().then(authHeader => {
                apiRemoveDomainBy({ name: domain.domain, authHeader })
                apiRemoveRewriteRuleSetBy({ name: rewriteRuleSet.name, authHeader })
                apiRemoveNCOSLevelBy({ name: ncosLevel.level, authHeader })
                apiRemoveEmergencyMappingContainerBy({ name: emergencyMappingContainer.name, authHeader })
                apiRemoveSoundSetBy({ name: soundSet.name, authHeader })
                apiRemoveResellerBy({ name: dependencyReseller.name, authHeader })
                apiRemoveContractBy({ name: dependencyContract.external_id, authHeader })
                apiRemoveSystemContactBy({ email: systemContactDependency.email, authHeader })
            })
        })
        
        it('Test all Access Restriction settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

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
            cy.wait(1000)
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
            testPreferencesChipField('ua_filter_list')
            testPreferencesToggleField('ua_filter_mode"]')
            testPreferencesToggleField('ua_reject_missing"]')
            testPreferencesToggleField('unauth_inbound_calls"]')
        })

        it('Test all Application settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Applications', itemContains: 'Applications' })
            testPreferencesListField('callrecording_type', 'External')
            testPreferencesToggleField('malicious_call_identification')
            testPreferencesToggleField('play_announce_before_call_setup')
            testPreferencesToggleField('play_announce_before_cf')
            testPreferencesListField('play_announce_before_recording', 'External calls only')
            testPreferencesToggleField('play_announce_to_callee')
            testPreferencesToggleField('play_emulated_ringback_tone')
        })

        it('Test all Call Blocking settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Call Blockings', itemContains: 'Call Blockings' })
            testPreferencesListField('adm_cf_ncos', ncosLevel.level)
            testPreferencesListField('adm_ncos', ncosLevel.level)
            testPreferencesListField('ncos', ncosLevel.level)
        })

        it('Test all IMS application server settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'IMS Application Server', itemContains: 'IMS Application Server' })
            testPreferencesToggleField('ims_as_context')
        })

        it('Test all Internal settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Internal', itemContains: 'Internal' })
            testPreferencesListField('accept_auto_answer', 'No')
            testPreferencesListField('advice_of_charge', 'Currency')
            testPreferencesListField('alert_info_type', 'internal_external')
            testPreferencesTextField('alert_info_url')
            testPreferencesListField('call_deflection', 'Disabled')
            testPreferencesTextField('concurrent_calls_quota', 123)
            testPreferencesTextField('conference_max_participants', 123)
            testPreferencesTextField('contact_ringtimeout', 123)
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('default_lnp_prefix')
            cy.get('div[data-cy="q-item--contact-ringtimeout"]').should('not.exist')
            testPreferencesTextField('default_lnp_prefix')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('disable_prack_method')
            cy.get('div[data-cy="q-item--default-lnp-prefix"]').should('not.exist')
            testPreferencesToggleField('disable_prack_method')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('emergency_mode_enabled')
            cy.get('div[data-cy="q-item--disable-prack-method"]').should('not.exist')
            testPreferencesToggleField('emergency_mode_enabled')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('f')
            cy.get('div[data-cy="q-item--emergency-mode-enabled"]').should('not.exist')
            cy.get('div[data-cy="q-item--force-inbound-calls-to-peer"]').scrollIntoView()
            testPreferencesListField('force_inbound_calls_to_peer', 'Always')
            testPreferencesListField('force_outbound_calls_to_peer', 'Always')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('i')
            cy.get('div[data-cy="q-item--force-outbound-calls-to-peer"]').should('not.exist')
            testPreferencesTextField('identifier')
            testPreferencesTextField('ip_header')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('la')
            cy.get('div[data-cy="q-item--ip-header"]').should('not.exist')
            testPreferencesListField('language', 'German')
            testPreferencesToggleField('last_number_redial')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('lcr_peer_cf')
            cy.get('div[data-cy="q-item--last-number-redial"]').should('not.exist')
            testPreferencesToggleField('lcr_peer_cf')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('lnp_')
            cy.get('div[data-cy="q-item--lcr-peer-cf"]').should('not.exist')
            testPreferencesToggleField('lnp_add_npdi')
            testPreferencesToggleField('lnp_for_local_sub')
            testPreferencesToggleField('lnp_to_rn')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('lookup_all_registrations')
            cy.get('div[data-cy="q-item--lnp-to-rn"]').should('not.exist')
            testPreferencesToggleField('lookup_all_registrations')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('mobile_push')
            cy.get('div[data-cy="q-item--lookup-all-registrations"]').should('not.exist')
            testPreferencesListField('mobile_push_enable', 'Send push only if no device registered')
            testPreferencesTextField('mobile_push_expiry', 123)
            // cy.get('label[data-cy="aui-input-search"] input').clear().type('prepaid_library')
            // cy.wait(1)
            // testPreferencesListField('prepaid_library', 'libswrate') disabled, only libswrate available and selecting it again doesnt trigger saving mechanism
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('re')
            cy.get('div[data-cy="q-item--mobile-push-expiry"]').should('not.exist')
            cy.get('div[data-cy="q-item--recent-calls-by-upn"]').scrollIntoView()
            testPreferencesToggleField('recent_calls_by_upn')
            testPreferencesChipField('rerouting_codes', { value1: '123', value2: '54321' })
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('s')
            cy.wait(2)
            cy.get('div[data-cy="q-item--serial-forking-by-q-value"]').scrollIntoView()
            testPreferencesListField('serial_forking_by_q_value', 'Standard')
            testPreferencesListField('smsc_peer', 'default')
            testPreferencesToggleField('stir_check')
            testPreferencesTextField('stir_pub_url')
            testPreferencesChipField('stop_forking_code_lists', { value1: '123', value2: '54321' })
            testPreferencesListField('support_auto_answer"]', 'If provided by phone')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('ua')
            cy.get('div[data-cy="q-item--stop-forking-code-lists"]').should('not.exist')
            testPreferencesListField('ua_header_mode', 'Replace')
            testPreferencesTextField('ua_header_replace"]')
        })

        it('Test all Media Codec Transcoding Options settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Media Codec Transcoding Options', itemContains: 'Media Codec Transcoding Options' })
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('AMR')
            cy.wait(2)
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
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('always_transcode')
            cy.get('div[data-cy="q-item--AMR-octet-align"]').should('not.exist')
            testPreferencesToggleField('always_transcode')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('convert_dtmf_info')
            cy.get('div[data-cy="q-item--always-transcode"]').should('not.exist')
            testPreferencesToggleField('convert_dtmf_info')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('g723_bitrate')
            cy.get('div[data-cy="q-item--convert-dtmf-info"]').should('not.exist')
            testPreferencesListField('g723_bitrate', '6.3 kbit/s')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('opus')
            cy.get('div[data-cy="q-item--g723-bitrate"]').should('not.exist')
            testPreferencesListField('opus_mono_bitrate', '32 kbit/s')
            testPreferencesListField('opus_stereo_bitrate', '32 kbit/s')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('ptime')
            cy.get('div[data-cy="q-item--opus-stereo-bitrate"]').should('not.exist')
            testPreferencesListField('ptime', '60 ms')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('T38')
            cy.get('div[data-cy="q-item--ptime"]').should('not.exist')
            cy.get('div[data-cy="q-item--t-38-fec"]').scrollIntoView()
            testPreferencesToggleField('T38_FEC')
            testPreferencesToggleField('T38_decode')
            testPreferencesToggleField('T38_force')
            testPreferencesToggleField('T38_no_ECM')
            testPreferencesToggleField('T38_no_IAF')
            testPreferencesToggleField('T38_no_V17')
            testPreferencesToggleField('T38_no_V27ter')
            testPreferencesToggleField('T38_no_V29')
            testPreferencesToggleField('T38_no_V34')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('transcode')
            cy.get('div[data-cy="q-item--T38-no-V34"]').should('not.exist')
            cy.get('div[data-cy="q-item--transcode-amr"]').scrollIntoView()
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
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

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
            testPreferencesListField('nat_sipping', 'No')
            testPreferencesToggleField('original_sendrecv')
            testPreferencesListField('record_call', 'On (always)')
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
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

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
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('outbound')
            cy.get('div[data-cy="q-item--no-404-fallback"]').should('not.exist')
            cy.get('div[data-cy="q-item--outbound-diversion"]').scrollIntoView()
            testPreferencesListField('outbound_diversion', 'UPRN')
            testPreferencesListField('outbound_from_display', 'Authentication-User')
            testPreferencesListField('outbound_from_user', 'Authentication-User')
            testPreferencesToggleField('outbound_from_user_is_phone')
            testPreferencesListField('outbound_history_info', 'UPRN')
            testPreferencesListField('outbound_pai_display', 'Authentication-User')
            testPreferencesListField('outbound_pai_user', 'Authentication-User')
            testPreferencesListField('outbound_ppi_user', 'Authentication-User')
            testPreferencesListField('outbound_to_user', 'Received To header')
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('rewrite_rule_set')
            cy.get('div[data-cy="q-item--outbound-from-user-is-phone"]').should('not.exist')
            testPreferencesListField('rewrite_rule_set', rewriteRuleSet.name)
            cy.get('label[data-cy="aui-input-search"] input').clear()
            cy.get('label[data-cy="aui-input-search"] input').type('skip_upn_check_on_diversion')
            cy.get('div[data-cy="q-item--rewrite-rule-set"]').should('not.exist')
            testPreferencesListField('skip_upn_check_on_diversion', 'If received Diversion header')
        })

        it('Test all Remote Authentication settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

            waitPageProgress()
            cy.qSelect({ dataCy: 'category-selection', filter: 'Remote Authentication', itemContains: 'Remote Authentication' })
            testPreferencesToggleField('peer_auth_register')
        })

        it('Test all Session Timers settings in domain', () => {
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.navigateMainMenu('settings / domain')

            cy.locationShouldBe('#/domain')
            searchInDataTable(domain.domain)
            cy.get('[data-cy=aui-data-table] .q-checkbox:first').click()
            clickDataTableSelectedMoreMenuItem('domainPreferences')

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
