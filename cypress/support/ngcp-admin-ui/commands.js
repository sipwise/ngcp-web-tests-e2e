// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const debugging = false
const quiet = {
    log: debugging
}

Cypress.Commands.add('expandMainMenuSection', (key) => {
    Cypress.log({
        name: 'expandMainMenuSection',
        displayName: 'expandMainMenuSection',
        message: ' : ' + key,
        autoEnd: true
    })

    const menuItemSelector = `.main-menu-items [data-cy=aui-main-menu-items--${key}]`
    const ownExpansionIconSelector = ' > .q-expansion-item__container > .q-item .q-expansion-item__toggle-icon'
    cy.get(`${menuItemSelector} ${ownExpansionIconSelector}`, quiet).then($icon => {
        // clicking on the section only if it's not expanded yet
        if (!$icon.hasClass('q-expansion-item__toggle-icon--rotated')) {
            cy.get(menuItemSelector, quiet).click(quiet)
        }
    })
})

Cypress.Commands.add('getMainMenuItem', (key) => {
    Cypress.log({
        name: 'getMainMenuItem',
        displayName: 'getMainMenuItem',
        message: ' : ' + key,
        autoEnd: true
    })

    return cy.get(`.main-menu-items [data-cy=aui-main-menu-item--${key}]`, quiet)
})

Cypress.Commands.add('navigateMainMenu', (path = '', waitForPageLoading = true) => {
    Cypress.log({
        name: 'navigateMainMenu',
        displayName: 'navigateMainMenu',
        message: ' : ' + path,
        autoEnd: true
    })

    const pathParts = String(path).split('/').map(e => e.trim())
    if (pathParts.length === 2) {
        const [groupKey, subItemKey] = pathParts
        cy.expandMainMenuSection(groupKey)
        cy.getMainMenuItem(subItemKey).click()
    } else if (pathParts.length === 1) {
        cy.getMainMenuItem(pathParts.pop()).click()
    }

    const waitPageProgress = () => {
        cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
        cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
    }

    if (waitForPageLoading) {
        waitPageProgress()
    }

    // // TODO: maybe we do not need to wait conditionally for the pages' data loading. So we can replace the complex check below with just an imput config parameter OR remove it completely
    // // TODO: it will be nice to replace it with a custom "auto retry" mechanism. Example: https://github.com/cypress-io/cypress-xpath/pull/12/files
    // const waitDataLoading = () => {
    //     cy.log('waiting for the page initialization...')
    //     cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('be.visible')
    //     cy.get('[data-cy=q-page-sticky] .q-linear-progress').should('not.exist')
    // }
    // let's wait for loading an application's JS chunk for the page
    // cy.wait(50).then(() => {
    //     let $pageContextToolbar = Cypress.$('.q-page-container [data-cy=q-page-sticky]')
    //     if ($pageContextToolbar.length) {
    //         waitDataLoading()
    //     } else {
    //         cy.wait(500).then(() => {
    //             $pageContextToolbar = Cypress.$('.q-page-container [data-cy=q-page-sticky]')
    //             if ($pageContextToolbar.length) {
    //                 waitDataLoading()
    //             }
    //         })
    //     }
    // })
})

Cypress.Commands.add('locationShouldBe', (urlHash) => {
    Cypress.log({
        name: 'locationShouldBe',
        displayName: 'locationShouldBe',
        message: urlHash,
        autoEnd: true
    })

    return cy.location('hash').should('eq', urlHash)
})

Cypress.Commands.add(
    'qSelect',
    { prevSubject: ['optional', 'element'] },
    (subject, { dataCy, filter, itemContains }) => {
        const inputElementSelector = `[data-cy="${dataCy}"].q-field__native`
        const labelElementSelector = `label[data-cy="${dataCy}"]`
        ;(subject ? cy.wrap(subject) : cy.get('body')).then($parent => {
            const inputElementExists = $parent.find(inputElementSelector).length

            if (typeof filter !== 'undefined' && filter !== '') {
                if (inputElementExists) {
                    cy.wrap($parent).find(inputElementSelector).type(filter)
                } else {
                    throw new Error('Current qSelect is not filterable')
                }
            } else {
                if (inputElementExists) {
                    cy.wrap($parent).find(inputElementSelector).click()
                } else {
                    cy.wrap($parent).find(labelElementSelector).click()
                }
            }

            cy.wait(200)
            cy.wrap($parent).find(labelElementSelector).then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                cy.contains(`${dropdownListId} .q-item`, itemContains).should('be.visible')
                cy.contains(`${dropdownListId} .q-item`, itemContains).click()
            })
        })
    }
)

Cypress.Commands.add('auiSelectLazySelect',
    { prevSubject: ['optional', 'element'] },
    (subject, { dataCy, filter, itemContains }) => {
        const inputElementSelector = `[data-cy="${dataCy}"] input`
        const labelElementSelector = `label[data-cy="${dataCy}"]`
        ;(subject ? cy.wrap(subject) : cy.get('body')).then($parent => {
            if (filter) {
                cy.wrap($parent).find(inputElementSelector).type(filter)
            } else {
                cy.wrap($parent).find(inputElementSelector).click()
            }
            cy.wrap($parent).find(labelElementSelector)
                .find('.q-spinner').should('be.visible')
                .parent()
                .find('.q-spinner').should('not.exist')

            cy.wait(500)
            cy.wrap($parent).find(labelElementSelector).then($el => {
                const id = $el.attr('for')
                const dropdownListId = `#${id}_lb`
                cy.get(dropdownListId).should('be.visible')
                    .find('.q-linear-progress').should('not.exist')
                cy.contains(`${dropdownListId} .q-item`, itemContains).click()
            })
        })
    }
)
