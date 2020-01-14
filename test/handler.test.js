/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * ModusBox
 - Neal Donnan <neal.donnan@modusbox.com>
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

const Test = require('tape')
const Boom = require('@hapi/boom')
const Factory = require('../src/factory')
const Enums = require('../src/enums')
const Handler = require('../src/handler')
const Proxyquire = require('proxyquire')
const Sinon = require('sinon')

Test('Handler should', handlerTest => {
  handlerTest.test('handle non error responses', async function (test) {
    const response = {}
    test.ok(Handler.onPreResponse({ response: response }, { continue: true }))
    test.end()
  })

  handlerTest.test('handle FSPIOPError responses', async function (test) {
    const fspiopError = Factory.createFSPIOPError(Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, 'Internal Error')
    const response = fspiopError
    test.ok(Handler.onPreResponse({ response: response }, { continue: true }))
    test.equal(response.output.statusCode, 500)
    test.equal(response.output.payload.errorInformation.errorCode, '2001')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Internal server error - Internal Error')
    test.end()
  })

  handlerTest.test('handle FSPIOPError with undefined httpStatusCode', async function (test) {
    const fspiopError = Factory.createFSPIOPError(Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, 'Internal Error without httpStatusCode')
    delete fspiopError.httpStatusCode
    const response = fspiopError
    test.ok(Handler.onPreResponse({ response: response }, { continue: true }))
    test.equal(response.output.statusCode, 500)
    test.equal(response.output.payload.errorInformation.errorCode, '2001')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Internal server error - Internal Error without httpStatusCode')
    test.end()
  })

  handlerTest.test('handle generic Error responses', async function (test) {
    const error = new Error('Test Error')
    const response = error
    test.ok(Handler.onPreResponse({ response: response }, { continue: true }))
    test.equal(response.output.statusCode, 500)
    test.equal(response.output.payload.errorInformation.errorCode, '2001')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Internal server error - Test Error')
    test.end()
  })

  handlerTest.test('handle Boom errors', async function (test) {
    const response = {
      isBoom: true,
      output:
        {
          payload:
            {
              error: 'BadRequest'
            }
        }
    }
    Handler.onPreResponse({ response: response, headers: { 'fspiop-source': 'dfsp1' } }, {})
    test.equal(response.output.payload.errorInformation.errorCode, '2001')
    test.end()
  })

  handlerTest.test('handle Boom generated errors', async function (test) {
    const response = Boom.badRequest('some bad parameters')

    Handler.onPreResponse({ response }, {})
    test.equal(response.output.statusCode, 400)
    test.equal(response.output.payload.errorInformation.errorCode, '3000')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Generic client error - some bad parameters')
    test.end()
  })

  handlerTest.test('handle a Boom 404 error', async function (test) {
    const response = Boom.notFound('Not Found')

    Handler.onPreResponse({ response }, {})
    test.equal(response.output.statusCode, 404)
    test.equal(response.output.payload.errorInformation.errorCode, '3002')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Unknown URI - Not Found')
    test.end()
  })

  handlerTest.test('handle a Boom 415 error', async function (test) {
    const response = Boom.forbidden()
    response.output.statusCode = 415
    // response.output.payload['csrf-decorator'] = request.headers['csrf-decorator']
    response.reformat()

    Handler.onPreResponse({ response }, {})
    test.equal(response.output.statusCode, 400)
    test.equal(response.output.payload.errorInformation.errorCode, '3101')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Malformed syntax - Forbidden')
    test.end()
  })

  handlerTest.test('handle a Boom Generic server error', async function (test) {
    const sandbox = Sinon.createSandbox()
    const FactoryStub = {
      createFSPIOPError: sandbox.stub().returns(Factory.createFSPIOPErrorFromErrorCode('2000'))
    }
    const Handler = Proxyquire('../src/handler', {
      './factory': FactoryStub
    })

    const response = Boom.forbidden()
    response.output.statusCode = null
    response.reformat()

    Handler.onPreResponse({ response }, {})
    test.equal(response.output.statusCode, 500)
    test.equal(response.output.payload.errorInformation.errorCode, '2000')
    test.equal(response.output.payload.errorInformation.errorDescription, 'Generic server error')
    test.end()
  })

  handlerTest.test('handle JOI validation errors', async function (test) {
    const response = {
      isBoom: true,
      isJoi: true,
      details: [{
        message: 'Regular expression failed validation',
        type: 'string.regex.base',
        context: {
          label: 'Regular expression failed'
        }
      }]
    }
    Handler.onPreResponse({ response: response }, {})
    test.equal(response.output.payload.errorInformation.errorDescription, 'Malformed syntax - Regular expression failed validation')
    test.equal(response.output.payload.errorInformation.errorCode, '3101')
    test.end()
  })

  handlerTest.test('handle incoming valid mojaloop specification error code', async function (test) {
    const payload =
      {
        errorInformation:
          {
            errorCode: '5105',
            errorDescription: 'Payee transaction limit reached',
            extensionList:
              {
                extension:
                  [{
                    key: 'errorDetail',
                    value: 'This is an abort extension'
                  }]
              }
          }
      }
    test.equal(Handler.validateIncomingErrorCode({ payload: payload }, { continue: payload }), payload)
    test.end()
  })

  handlerTest.test('handle incoming valid mojaloop specification error code, with a specific error above 39 which can be used for scheme-specific errors', async function (test) {
    const payload =
      {
        errorInformation:
          {
            errorCode: '5199',
            errorDescription: 'Payee transaction limit reached',
            extensionList:
              {
                extension:
                  [{
                    key: 'errorDetail',
                    value: 'This is an abort extension'
                  }]
              }
          }
      }
    test.equal(Handler.validateIncomingErrorCode({ payload: payload }, { continue: payload }), payload)
    test.end()
  })

  handlerTest.test('handle incoming mojaloop specification error code with invalid category', async function (test) {
    const payload =
      {
        errorInformation:
          {
            errorCode: '15105',
            errorDescription: 'Payee transaction limit reached',
            extensionList:
              {
                extension:
                  [{
                    key: 'errorDetail',
                    value: 'This is an abort extension'
                  }]
              }
          }
      }

    const takeoverMessage =
      {
        errorInformation: {
          errorCode: '3100',
          errorDescription: 'Generic validation error - The incoming error code: 15105 is not a valid mojaloop specification error code'
        }
      }

    const h = {
      response: () => {
        return {
          code: () => {
            return {
              takeover: () => { return takeoverMessage }
            }
          }
        }
      }
    }

    test.equal(Handler.validateIncomingErrorCode({ payload: payload }, h), takeoverMessage)
    test.end()
  })
  handlerTest.end()
})
