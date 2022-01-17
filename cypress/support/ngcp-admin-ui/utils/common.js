
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

export const searchInDataTable = (text) => {
    cy.get('[data-cy="aui-input-search--datatable"] input').clear().type(text)
    waitPageProgress()
}

export const deleteItemOnListPageByName = (name) => {
    searchInDataTable(name)
    cy.get('[data-cy=aui-data-table] .q-checkbox').click()
    clickToolbarActionButton('delete')
    cy.get('[data-cy="negative-confirmation-dialog"] [data-cy="btn-confirm"]').click()
    cy.contains('.q-table__bottom--nodata', 'No matching records found').should('be.visible')
}

export const clickDataTableSelectedMoreMenuItem = (actionName) => {
    cy.get('[data-cy=aui-data-table] tr.selected [data-cy="row-more-menu-btn"]:first').click()
    return cy.get(`.q-menu [data-cy="aui-popup-menu-item--${actionName}"]`).click()
}
