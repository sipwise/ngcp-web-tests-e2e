/// <reference types="cypress" />

import {
    searchInDataTable,
    apiCreateContract,
    apiCreatePbxDeviceConfig,
    apiCreatePbxDeviceFirmware,
    apiCreatePbxDeviceModel,
    apiCreateReseller,
    apiCreateSystemContact,
    apiLoginAsSuperuser,
    apiRemoveContractBy,
    apiRemovePbxDeviceModelBy,
    apiRemoveResellerBy,
    apiRemoveSystemContactBy,
    apiRemovePbxDeviceConfigBy,
    apiRemovePbxDeviceFirmwareBy,
    deleteItemOnListPageBy,
    testPreferencesTextField,
    testPreferencesToggleField,
    waitPageProgressAUI,
    apiCreatePbxDeviceProfile,
    apiRemovePbxDeviceProfileBy
} from '../../../support/e2e'

const downloadsFolder = Cypress.config('downloadsFolder')
const fixturesFolder = Cypress.config('fixturesFolder')
const ngcpConfig = Cypress.config('ngcpConfig')
const path = require('path')

export const contract = {
    contact_id: 0,
    status: 'active',
    external_id: 'contractDeviceManagementCypress',
    type: 'reseller',
    billing_profile_definition: 'id',
    billing_profile_id: 1
}

export const reseller = {
    contract_id: 0,
    status: 'active',
    name: 'resellerDeviceManagementCypress',
    enable_rtc: false
}

const systemContact = {
    email: 'systemContactDeviceMan@example.com'
}

const pbxDeviceFirmware = {
    version: "1.0",
    tag: "FirmwareDeviceManagementCypress",
    device_id: 0,
    filename: "firmware.z"
}

const pbxDeviceConfig = {
    id: 0,
    version: "ConfigDeviceManagementCypress",
    device_id: 0
}

const pbxDeviceProfile = {
    config_id: 0,
    name: "ProfileDeviceManagementCypress"
}

const deviceModelFormData = new FormData()
var iscloudpbx = null

context('Device management tests', () => {
    context('Device management tests', () => {
        const pbxDeviceModel = {
            reseller_id: null,
            bootstrap_config_http_sync_method: "GET",
            bootstrap_config_http_sync_params: "http://client.ip/admin/resync",
            bootstrap_config_http_sync_uri: "http://client.ip/admin/resync",
            bootstrap_method: "http",
            bootstrap_uri: null,
            connectable_models: [],
            extensions_num: 0,
            linerange: [
              {
                can_blf: false,
                can_forward: false,
                can_private: true,
                can_shared: false,
                can_speeddial: false,
                can_transfer: false,
                keys: [
                  {
                    labelpos: "top",
                    x: 0,
                    y: 0
                  }
                ],
                name: "Phone keys",
                num_lines: 1
              }
            ],
            model: "testmodelCypress",
            type: "phone",
            vendor: "ALE"
        }

        before(() => {
            Cypress.log({ displayName: 'API URL', message: ngcpConfig.apiHost })
            cy.intercept('GET', '**/api/platforminfo').as('platforminfo')
            cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
            cy.wait('@platforminfo').then(({ response }) => {
                if (response.body.cloudpbx === true) {
                    iscloudpbx = true
                    apiLoginAsSuperuser().then(authHeader => {
                        Cypress.log({ displayName: 'INIT', message: 'Preparing environment...'})
                        cy.log('Preparing environment...')
                        apiRemoveResellerBy({ name: reseller.name, authHeader })
                        apiRemoveContractBy({ name: contract.external_id, authHeader })
                        apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                        cy.log('Data clean up pre-tests completed')
                        apiCreateSystemContact({ data: systemContact, authHeader }).then(({ id }) => {
                            contract.contact_id = id
                        })
                        apiCreateContract({ data: contract, authHeader }).then(({ id }) => {
                            apiCreateReseller({ data: { ...reseller, contract_id: id }, authHeader }).then(({ id }) => {
                                pbxDeviceModel.reseller_id = id
                            }).then(() => {
                                deviceModelFormData.append("json", JSON.stringify(pbxDeviceModel))
                            })
                        })
                        cy.fixture("phoneimage.png", 'base64').then((file) => {
                            deviceModelFormData.append("front_image", Cypress.Blob.base64StringToBlob(file, 'image/png'), 'phoneimage.png')
                        })
                        cy.fixture("empty.txt").then((file) => {
                            deviceModelFormData.append("mac_image", new Blob([file], { type: "text/plain" }), 'empty.txt')
                            deviceModelFormData.append("front_thumbnail", new Blob([file], { type: "text/plain" }), 'empty.txt')
                        })
                    })
                } else {
                    iscloudpbx = false
                    cy.log('CloudPBX is not enabled, exiting test...')
                }
            })

        })

        beforeEach(() => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    cy.log('Cleaning up db...')
                    apiRemovePbxDeviceProfileBy({ name: pbxDeviceProfile.name, authHeader})
                    apiRemovePbxDeviceConfigBy({ name: pbxDeviceConfig.version, authHeader })
                    apiRemovePbxDeviceFirmwareBy({ name: pbxDeviceFirmware.tag, authHeader })
                    apiRemovePbxDeviceModelBy({ name: pbxDeviceModel.model, authHeader })

                    cy.log('Seeding up db...')
                    apiCreatePbxDeviceModel({ data: deviceModelFormData, authHeader}).then(({ id }) => {
                        cy.fixture("firmware.z", 'binary').then((file) => {
                            apiCreatePbxDeviceFirmware({ parameters: { ...pbxDeviceFirmware, device_id: id }, blobData: Cypress.Blob.binaryStringToBlob(file, 'application/octet-stream'), authHeader })
                        })
                        cy.fixture("deviceconfigtestfile.xml").then((text) => {
                            apiCreatePbxDeviceConfig({ parameters: { ...pbxDeviceConfig, device_id: id }, data: text, authHeader }).then(({ id }) => {
                                pbxDeviceConfig.id = id
                                apiCreatePbxDeviceProfile({ data: { ...pbxDeviceProfile, config_id: id }, authHeader })
                            })
                        })
                    })
                })
            } else {
                cy.log('CloudPBX is not enabled, skipping preperation...')
            }
        })

        after(() => {
            Cypress.log({ displayName: 'END', message: 'Cleaning-up...' })
            cy.log('Data clean up...')
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceProfileBy({ name: pbxDeviceProfile.name, authHeader})
                    apiRemovePbxDeviceConfigBy({ name: pbxDeviceConfig.version, authHeader })
                    apiRemovePbxDeviceFirmwareBy({ name: pbxDeviceFirmware.tag, authHeader })
                    apiRemovePbxDeviceModelBy({ name: pbxDeviceModel.model, authHeader })
                    apiRemoveResellerBy({ name: reseller.name, authHeader })
                    apiRemoveContractBy({ name: contract.external_id, authHeader })
                    apiRemoveSystemContactBy({ email: systemContact.email, authHeader })
                })
            } else {
                cy.log('CloudPBX is not enabled, skipping cleanup...')
            }
        })

        it('Check if device model with invalid values gets rejected', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('input[data-cy="aui-select-reseller"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxdevicemodel-vendor"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxdevicemodel-model"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Create device model', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceModelBy({ name: pbxDeviceModel.model, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'aui-select-reseller', filter: 'resellerDeviceManagementCypress', itemContains: 'resellerDeviceManagementCypress' })
                cy.get('input[data-cy="aui-pbxdevicemodel-vendor"]').type(pbxDeviceModel.vendor)
                cy.get('input[data-cy="aui-pbxdevicemodel-model"]').type(pbxDeviceModel.model)
                cy.get('div[data-cy="aui-pbxdevicemodel-frontimage"]').find('input[data-cy="q-uploader-add-trigger--0"]').selectFile(path.join(fixturesFolder, 'phoneimage.png'), { force: 'true' })

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.locationShouldBe('#/devicemanagement/model')

                searchInDataTable(pbxDeviceModel.model, "Model")
                cy.get('td[data-cy="q-td--model"] span').contains(pbxDeviceModel.model).should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Edit device model', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                searchInDataTable(pbxDeviceModel.model, "Model")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementModelEdit"]').click()

                cy.get('input[data-cy="aui-pbxdevicemodel-vendor"]').clear().type('SNOM')

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.get('button[data-cy="aui-close-button"]').click()
                cy.locationShouldBe('#/devicemanagement/model')

                cy.get('td[data-cy="q-td--vendor"] span').contains('SNOM').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Upload picture to device model', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                searchInDataTable(pbxDeviceModel.model, "Model")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementModelEdit"]').click()

                cy.get('div[data-cy="aui-pbxdevicemodel-frontimage"] input').selectFile(path.join(fixturesFolder, 'phoneimage.png'), { force: 'true' })

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.get('button[data-cy="aui-close-button"]').click()
                cy.locationShouldBe('#/devicemanagement/model')

                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementModelFrontimage"]').click()
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Edit preferences for device model', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                searchInDataTable(pbxDeviceModel.model, "Model")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementModelPreferences"]').click()

                waitPageProgressAUI()
                testPreferencesToggleField('DNS-SRV-enable')
                testPreferencesTextField('admin-name')
                testPreferencesTextField('admin-pass')
                testPreferencesTextField('ntp-server')
                testPreferencesTextField('ntp-sync', '10')
                testPreferencesTextField('syslog-level', '5')
                testPreferencesTextField('syslog-server')
                testPreferencesToggleField('user-conf-priority')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Delete device model', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)

                cy.locationShouldBe('#/devicemanagement/model')

                deleteItemOnListPageBy(pbxDeviceModel.model, 'Model')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Check if device firmware with invalid values gets rejected', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/firmware"]').click()

                cy.locationShouldBe('#/devicemanagement/firmware')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('label[data-cy="aui-select-pbxdevicemodel"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxdevicefirmware-version"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxdevicefirmware-file"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Create device firmware', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceFirmwareBy({ name: pbxDeviceFirmware.tag, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/firmware"]').click()

                cy.locationShouldBe('#/devicemanagement/firmware')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'aui-select-pbxdevicemodel', filter: pbxDeviceModel.model, itemContains: pbxDeviceModel.model })
                cy.get('input[data-cy="aui-pbxdevicefirmware-version"]').type(pbxDeviceFirmware.version)
                cy.get('input[data-cy="aui-pbxdevicefirmware-tag"]').type(pbxDeviceFirmware.tag)
                cy.get('input[data-cy="aui-pbxdevicefirmware-file"]').selectFile(path.join(fixturesFolder, 'firmware.z'), { force: 'true' })

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.locationShouldBe('#/devicemanagement/firmware')

                searchInDataTable(pbxDeviceFirmware.tag, "Firmware tag")
                cy.get('td[data-cy="q-td--tag"] span').contains(pbxDeviceFirmware.tag).should('exist')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Edit device firmware', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/firmware"]').click()

                cy.locationShouldBe('#/devicemanagement/firmware')

                searchInDataTable(pbxDeviceFirmware.tag, "Firmware tag")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementFirmwareEdit"]').click()

                cy.get('input[data-cy="aui-pbxdevicefirmware-version"]').clear().type('testversion')

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.get('button[data-cy="aui-close-button"]').click()
                cy.locationShouldBe('#/devicemanagement/firmware')

                cy.get('td[data-cy="q-td--version"] span').contains('testversion').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        xit('Download device firmware', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/firmware"]').click()

                cy.locationShouldBe('#/devicemanagement/firmware')

                searchInDataTable(pbxDeviceFirmware.tag, "Firmware tag")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('div[data-cy="aui-data-table-row-menu--deviceManagementFirmwareDownload"]').click()

                const filename = path.join(downloadsFolder, 'firmware.z')
                cy.readFile(filename, 'binary', { timeout: 1000 })
                    .should(buffer => expect(buffer.length).to.be.gt(50))
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Delete device firmware', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/firmware"]').click()

                cy.locationShouldBe('#/devicemanagement/firmware')

                deleteItemOnListPageBy(pbxDeviceFirmware.tag, 'Firmware tag')                
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Check if device config with invalid values gets rejected', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/configuration"]').click()

                cy.locationShouldBe('#/devicemanagement/configuration')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('input[data-cy="aui-select-pbxdevicemodel"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxconfig-version"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxconfig-content"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Create device config', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceConfigBy({ name: pbxDeviceConfig.version, authHeader })
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/configuration"]').click()

                cy.locationShouldBe('#/devicemanagement/configuration')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'aui-select-pbxdevicemodel', filter: pbxDeviceModel.model, itemContains: pbxDeviceModel.model })
                cy.get('input[data-cy="aui-pbxconfig-version"]').type(pbxDeviceConfig.version)
                cy.get('textarea[data-cy="aui-pbxconfig-content"]').type("testcontent")

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.locationShouldBe('#/devicemanagement/configuration')

                searchInDataTable(pbxDeviceConfig.version, "Version")
                cy.get('td[data-cy="q-td--version"] span').contains(pbxDeviceConfig.version).should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Edit device config', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/configuration"]').click()

                cy.locationShouldBe('#/devicemanagement/configuration')

                searchInDataTable(pbxDeviceConfig.version, 'Version')
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementConfigurationEdit"]').click()

                cy.get('label[data-cy="aui-pbxconfig-contenttype"]').find('i[aria-label="Clear"]').click()
                cy.get('input[data-cy="aui-pbxconfig-contenttype"]').type('text/plain')

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.get('button[data-cy="aui-close-button"]').click()
                cy.locationShouldBe('#/devicemanagement/configuration')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Delete device config', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/configuration"]').click()

                cy.locationShouldBe('#/devicemanagement/configuration')

                deleteItemOnListPageBy(pbxDeviceConfig.version, 'Version')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Check if device profile with invalid values gets rejected', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/profile"]').click()

                cy.locationShouldBe('#/devicemanagement/profile')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.get('[data-cy=aui-save-button]').click()
                cy.get('input[data-cy="aui-select-pbxdeviceconfig"]').parents('label').find('div[role="alert"]').contains('Input is required').should('be.visible')
                cy.get('label[data-cy="aui-pbxprofile-name"]').find('div[role="alert"]').contains('Input is required').should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Create device profile', () => {
            if (iscloudpbx) {
                apiLoginAsSuperuser().then(authHeader => {
                    apiRemovePbxDeviceProfileBy({ name: pbxDeviceProfile.name, authHeader})
                })
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/profile"]').click()

                cy.locationShouldBe('#/devicemanagement/profile')

                cy.get('a[data-cy="aui-list-action--add"]').click()
                cy.auiSelectLazySelect({ dataCy: 'aui-select-pbxdeviceconfig', filter: pbxDeviceConfig.version, itemContains: pbxDeviceConfig.version })
                cy.get('label[data-cy="aui-pbxprofile-name"]').type(pbxDeviceProfile.name)

                cy.get('[data-cy=aui-save-button]').click()
                cy.get('div[role="alert"]', {timeout: 20000}).should('have.class', 'bg-positive')
                cy.locationShouldBe('#/devicemanagement/profile')

                searchInDataTable(pbxDeviceProfile.name, "Name")
                cy.get('td[data-cy="q-td--name"] span').contains(pbxDeviceProfile.name).should('be.visible')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Edit preferences for device profile', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/profile"]').click()

                cy.locationShouldBe('#/devicemanagement/profile')

                searchInDataTable(pbxDeviceProfile.name, "Name")
                cy.get('div[data-cy="q-checkbox"]').click()
                cy.get('button[data-cy="aui-list-action--edit-menu-btn"]').click()
                cy.get('a[data-cy="aui-data-table-row-menu--deviceManagementProfilePreferences"]').click()

                waitPageProgressAUI()
                testPreferencesToggleField('DNS-SRV-enable')
                testPreferencesTextField('admin-name')
                testPreferencesTextField('admin-pass')
                testPreferencesTextField('ntp-server')
                testPreferencesTextField('ntp-sync', '10')
                testPreferencesTextField('syslog-level', '5')
                testPreferencesTextField('syslog-server')
                testPreferencesToggleField('user-conf-priority')
                testPreferencesToggleField('web-gui-dis')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })

        it('Delete device profile', () => {
            if (iscloudpbx) {
                cy.quickLogin(ngcpConfig.username, ngcpConfig.password)
                cy.navigateMainMenu('settings / devicemanagement', false)
                cy.get('a[href="#/devicemanagement/profile"]').click()

                cy.locationShouldBe('#/devicemanagement/profile')

                deleteItemOnListPageBy(pbxDeviceProfile.name, 'Name')
            } else {
                cy.log('CloudPBX is not enabled, skipping test...')
            }
        })
    })
})
