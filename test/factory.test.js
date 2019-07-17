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

 * Neal Donnan <neal.donnan@modusbox.com>

 --------------
 ******/

'use strict'

const Test = require('tape')
const Factory = require('../src/factory')
const Errors = require('../src/enums').FSPIOPErrorCodes

Test('Factory should', factoryTest => {
  factoryTest.test('create an FSPIOPError with extensions', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, '2000')
    test.end()
  })

  factoryTest.test('create an FSPIOPError without extensions', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1')
    const apiErrorObject = fspiopError.toApiErrorObject()
    test.ok(fspiopError)
    test.equal(apiErrorObject.errorInformation.errorCode, '2000')
    test.end()
  })

  factoryTest.test('create an FSPIOPError from a Joi error', function (test) {
    const joiError = {
      type: 'any.required',
      context: {
        label: 'Field is required'
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromJoiError(joiError, { stack: 'Stack trace...' }, 'dfsp1')
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '3102',
        errorDescription: 'Missing mandatory element - Field is required',
        extensionList: [{
          key: 'cause',
          value: 'Stack trace...' }] }
    })
    test.end()
  })

  factoryTest.test('create an FSPIOPError from an unknown Joi error', function (test) {
    const joiError = {
      type: 'unknown',
      context: {
        label: 'Unknown issue'
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromJoiError(joiError)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '3100',
        errorDescription: 'Validation error - Unknown issue' }
    })
    test.end()
  })

  factoryTest.test('create an internal server FSPIOPError', function (test) {
    const cause = new Error('Test Cause')
    const fspiopError = Factory.createInternalServerFSPIOPError('Test Internal Error', cause, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    test.ok(fspiopError)
    test.ok(fspiopError.toString())
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Internal Error',
        extensionList: [
          {
            key: 'testKey',
            value: 'testValue'
          }
        ]
      }
    })
    test.end()
  })

  factoryTest.test('reformat an FSPIOPError from a general error', function (test) {
    const cause = new Error('Test Cause')
    const fspiopError = Factory.reformatFSPIOPError(cause)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Cause'
      }
    })
    test.end()
  })

  factoryTest.test('reformat an FSPIOPError from another FSPIOPError returning the original error', function (test) {
    const error = new Error('Invalid format')
    const cause = Factory.createFSPIOPError(Errors.MALFORMED_SYNTAX, 'Malformed parameter test', error, 'dfsp1')
    const fspiopError = Factory.reformatFSPIOPError(cause)
    test.ok(fspiopError)
    test.deepEqual(fspiopError, cause)
    test.end()
  })
  factoryTest.end()
})
