/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - Neal Donnan <neal.donnan@modusbox.com>
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import Boom from '@hapi/boom'
import * as Factory from '../src/factory'
import * as Enums from '../src/enums'
import * as Handler from '../src/handler'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

describe('Handler', () => {
  it('should handle non error responses', () => {
    const response: any = {}
    // @ts-ignore
    expect(Handler.onPreResponse({ response }, { continue: true })).toBeTruthy()
  })

  it('should handle FSPIOPError responses', () => {
    const fspiopError = Factory.createFSPIOPError(Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, 'Internal Error')
    const response: any = fspiopError
    // @ts-ignore
    expect(Handler.onPreResponse({ response }, { continue: true })).toBeTruthy()
    expect(response.output.statusCode).toBe(500)
    expect(response.output.payload.errorInformation.errorCode).toBe('2001')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Internal server error - Internal Error')
  })

  it('should handle FSPIOPError with undefined httpStatusCode', () => {
    const fspiopError: any = Factory.createFSPIOPError(Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, 'Internal Error without httpStatusCode')
    delete fspiopError.httpStatusCode
    const response: any = fspiopError
    // @ts-ignore
    expect(Handler.onPreResponse({ response }, { continue: true })).toBeTruthy()
    expect(response.output.statusCode).toBe(500)
    expect(response.output.payload.errorInformation.errorCode).toBe('2001')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Internal server error - Internal Error without httpStatusCode')
  })

  it('should handle generic Error responses', () => {
    const error = new Error('Test Error')
    const response: any = error
    // @ts-ignore
    expect(Handler.onPreResponse({ response }, { continue: true })).toBeTruthy()
    expect(response.output.statusCode).toBe(500)
    expect(response.output.payload.errorInformation.errorCode).toBe('2001')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Internal server error - Test Error')
  })

  it('should handle Boom errors', () => {
    const response: any = {
      isBoom: true,
      output: {
        payload: {
          error: 'BadRequest'
        }
      }
    }
    // @ts-ignore
    Handler.onPreResponse({ response, headers: { 'fspiop-source': 'dfsp1' } }, {})
    expect(response.output.payload.errorInformation.errorCode).toBe('2001')
  })

  it('should handle Boom generated errors', () => {
    const response: any = Boom.badRequest('some bad parameters')
    // @ts-ignore
    Handler.onPreResponse({ response }, {})
    expect(response.output.statusCode).toBe(400)
    expect(response.output.payload.errorInformation.errorCode).toBe('3000')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Generic client error - some bad parameters')
  })

  it('should handle a Boom 404 error', () => {
    const response: any = {
      isBoom: true,
      output: {
        statusCode: 404,
        payload: {
          error: 'BadRequest'
        },
        headers: {
          Allow: 'get'
        }
      },
      message: 'Not Found'
    }

    const request: any = {
      path: '/noMatchingUrl/1357902468/vlkdfnvfdvnkj/vcjknsdjcnsj',
      server: {},
      response
    }

    request.server.table = () => [{ method: 'get', path: '/XXXX' }]
    request.server.match = (_server: any, _path: string) => null

    const reply = { continue: 123 }
    // @ts-ignore
    Handler.onPreResponse(request, reply)
    expect(response.output.statusCode).toBe(404)
    expect(response.output.payload.errorInformation.errorCode).toBe('3002')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Unknown URI - Not Found')
  })

  it('should handle a Boom 405 error', () => {
    const response: any = {
      message: '',
      output: {
        statusCode: 404,
        headers: {
          Allow: 'get'
        }
      }
    }

    const request: any = {
      path: '/authorizations/1357902468',
      server: {}
    }

    request.server.table = () => [{ method: 'get', path: '/authorizations/{ID}' }]
    request.server.match = (_server: any, _path: string) => ({})

    const handlerResult = Handler.createFSPIOPErrorFromErrorResponse(request, response)
    expect(handlerResult.apiErrorCode.code).toBe('3000')
    expect(handlerResult.apiErrorCode.message).toBe('Generic client error - Method Not Allowed')
    expect(handlerResult.apiErrorCode.httpStatusCode).toBe(405)

    let matches = [{ method: 'get' }]
    let allowedHeaderValues = Handler.getAllowHeaders(matches)
    expect(allowedHeaderValues).toBe('get')

    request.server.table = () => [
      { method: 'get', path: '/authorizations/{ID}' },
      { method: 'put', path: '/authorizations/{ID}' },
      { method: 'post', path: '/authorizationsXX/{ID}' }
    ]

    matches = [{ method: 'get' }, { method: 'put' }]
    allowedHeaderValues = Handler.getAllowHeaders(matches)
    expect(allowedHeaderValues).toBe('get,put')
  })

  it('should handle a Boom 415 error', () => {
    const response: any = Boom.forbidden()
    response.output.statusCode = 415
    response.reformat()
    // @ts-ignore
    Handler.onPreResponse({ response }, {})
    expect(response.output.statusCode).toBe(400)
    expect(response.output.payload.errorInformation.errorCode).toBe('3101')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Malformed syntax - Forbidden')
  })

  it('should handle a Boom Generic server error', () => {
    const sandbox = sinon.createSandbox()
    const FactoryStub = {
      // @ts-ignore
      createFSPIOPError: sandbox.stub().returns(Factory.createFSPIOPErrorFromErrorCode('2000'))
    }
    const HandlerProxy = proxyquire('../src/handler', {
      './factory': FactoryStub
    })

    const response: any = Boom.forbidden()
    response.output.statusCode = null
    response.reformat()

    HandlerProxy.onPreResponse({ response }, {})
    expect(response.output.statusCode).toBe(500)
    expect(response.output.payload.errorInformation.errorCode).toBe('2000')
    expect(response.output.payload.errorInformation.errorDescription).toBe('Generic server error')
    sandbox.restore()
  })

  it('should handle JOI validation errors', () => {
    const response: any = {
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
    // @ts-ignore
    Handler.onPreResponse({ response }, {})
    expect(response.output.payload.errorInformation.errorDescription).toBe('Malformed syntax - Regular expression failed validation')
    expect(response.output.payload.errorInformation.errorCode).toBe('3101')
  })

  it('should handle incoming valid mojaloop specification error code', () => {
    const payload = {
      errorInformation: {
        errorCode: '5105',
        errorDescription: 'Payee transaction limit reached',
        extensionList: {
          extension: [{
            key: 'errorDetail',
            value: 'This is an abort extension'
          }]
        }
      }
    }
    // @ts-ignore
    expect(Handler.validateIncomingErrorCode({ payload }, { continue: payload })).toBe(payload)
  })

  it('should handle incoming valid mojaloop specification error code, with a specific error above 39 which can be used for scheme-specific errors', () => {
    const payload = {
      errorInformation: {
        errorCode: '5199',
        errorDescription: 'Payee transaction limit reached',
        extensionList: {
          extension: [{
            key: 'errorDetail',
            value: 'This is an abort extension'
          }]
        }
      }
    }
    // @ts-ignore
    expect(Handler.validateIncomingErrorCode({ payload }, { continue: payload })).toBe(payload)
  })

  it('should handle incoming mojaloop specification error code with invalid category', () => {
    const payload = {
      errorInformation: {
        errorCode: '15105',
        errorDescription: 'Payee transaction limit reached',
        extensionList: {
          extension: [{
            key: 'errorDetail',
            value: 'This is an abort extension'
          }]
        }
      }
    }

    const takeoverMessage = {
      errorInformation: {
        errorCode: '3100',
        errorDescription: 'Generic validation error - The incoming error code: 15105 is not a valid mojaloop specification error code'
      }
    }

    const h = {
      response: () => ({
        code: () => ({
          takeover: () => takeoverMessage
        })
      })
    }

    // @ts-ignore
    expect(Handler.validateIncomingErrorCode({ payload }, h)).toBe(takeoverMessage)
  })
})
