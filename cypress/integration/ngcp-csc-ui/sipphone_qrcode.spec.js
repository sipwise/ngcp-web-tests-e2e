import { Decoder } from '@nuintun/qrcode'

const ngcpConfigCSC = Cypress.config('ngcpConfig')
const qrReader = new Decoder()

function DecodeQrCode () {
    return cy.get('[data-cy=qr-code-img]')
        .then((qrCodeImgJQuery) => {
            const qrCodeDomNode = qrCodeImgJQuery[0]
            const qrCodeDataUrl = qrCodeDomNode.src
            return qrReader.scan(qrCodeDataUrl)
        }).then((scanResult) => {
            return Promise.resolve(new URLSearchParams(scanResult.data))
        })
}

function TestQrCode (data) {
    let body
    if (data) {
        body = { body: data }
    }
    cy.intercept('POST', '/api/authtokens', body).as('token')
    cy.get('[data-cy=qr-code-btn]').click()
    cy.wait('@token').then((interception) => {
        let resData
        if (typeof interception.response.body === 'string') {
            resData = JSON.parse(interception.response.body)
        } else if (interception.response.body) {
            resData = interception.response.body
        }
        DecodeQrCode().then((decodedData) => {
            expect(decodedData.get('token')).to.equal(resData.token)
        })
    })
}

context('QR code for sip:phone authentication', () => {
    before(() => {
        Cypress.log({ displayName: 'API URL', message: ngcpConfigCSC.apiHost })
    })

    beforeEach(() => {
        cy.login(ngcpConfigCSC.username, ngcpConfigCSC.password)
        cy.visit('/')
    })

    it('should scan the QR-Code for sip:phone login using a fixture', () => {
        cy.fixture('sipphone_qrcode_authtoken.json').then((data) => {
            TestQrCode(data)
        })
    })

    it('should scan the QR-Code for sip:phone login', () => {
        TestQrCode()
    })
})
