export const getRandomNum = (maxLength = 5) => Math.floor((Math.random() * Math.pow(10, maxLength)) + 1)

export const waitPageProgress = () => {
    cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
    cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
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
    cy.get('[data-cy="aui-input-search--datatable"] input').clear().type(searchText)
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
    cy.get('[data-cy=aui-data-table] tr.selected [data-cy="row-more-menu-btn"]:first').click()
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

    cy.get('@' + cyAliasName).find('input').clear().type(testValues.value1)
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
