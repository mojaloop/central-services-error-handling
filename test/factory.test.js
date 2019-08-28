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
 - Juan Correa <juan.correa@modusbox.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

'use strict'

const Test = require('tape')
const Factory = require('../src/factory')
const Errors = require('../src/enums').FSPIOPErrorCodes
const ErrorModelTypes = require('../src/enums').MojaloopModelTypes

Test('Factory should', factoryTest => {
  factoryTest.test('create an FSPIOPError with extensions', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, Errors.SERVER_ERROR.code)
    test.end()
  })

  factoryTest.test('create an FSPIOPError with extensions and error object cause', function (test) {
    const standardError = new Error('Here be dragons!')
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, 'An error has occurred', standardError, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, Errors.SERVER_ERROR.code)
    test.ok(fspiopError.stack.includes(`\n${standardError.stack}`))
    test.end()
  })

  factoryTest.test('create an FSPIOPError without extensions', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1')
    const apiErrorObject = fspiopError.toApiErrorObject()
    test.ok(fspiopError)
    test.equal(apiErrorObject.errorInformation.errorCode, Errors.SERVER_ERROR.code)
    test.end()
  })

  factoryTest.test('create an FSPIOPError undefined apiErrorCode extensions', function (test) {
    try {
      const apiErrorCode = undefined
      const fspiopError = Factory.createFSPIOPError(apiErrorCode, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1')
      const apiErrorObject = fspiopError.toApiErrorObject()
      test.ok(fspiopError)
      test.equal(apiErrorObject.errorInformation.errorCode, Errors.INTERNAL_SERVER_ERROR.code)
      test.fail(`We should have thrown an error here as the apiErrorCode is ${apiErrorCode}`)
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.equal(err.apiErrorCode.code, Errors.INTERNAL_SERVER_ERROR.code)
    }
    test.end()
  })

  factoryTest.test('create an FSPIOPError with empty message', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, '', { stack: 'Error:...' }, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    const fspiopErrorDescription = fspiopError.toApiErrorObject()
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorCode, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorDescription, Errors.SERVER_ERROR.message)
    test.end()
  })

  factoryTest.test('create an FSPIOPError with null message', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, null, { stack: 'Error:...' }, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    const fspiopErrorDescription = fspiopError.toApiErrorObject()
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorCode, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorDescription, Errors.SERVER_ERROR.message)
    test.end()
  })

  factoryTest.test('create an FSPIOPError with undefined message', function (test) {
    const fspiopError = Factory.createFSPIOPError(Errors.SERVER_ERROR, undefined, { stack: 'Error:...' }, 'dfsp1', [
      { key: 'testKey', value: 'testValue' }
    ])
    const fspiopErrorDescription = fspiopError.toApiErrorObject()
    test.ok(fspiopError)
    test.equal(fspiopError.apiErrorCode.code, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorCode, Errors.SERVER_ERROR.code)
    test.equal(fspiopErrorDescription.errorInformation.errorDescription, Errors.SERVER_ERROR.message)
    test.end()
  })

  factoryTest.test('create an FSPIOPError undefined apiErrorCode extensions', function (test) {
    try {
      const apiErrorCode = { foo: 'bar' }
      const fspiopError = Factory.createFSPIOPError(apiErrorCode, 'An error has occurred', { stack: 'Error:...' }, 'dfsp1')
      const apiErrorObject = fspiopError.toApiErrorObject()
      test.ok(fspiopError)
      test.equal(apiErrorObject.errorInformation.errorCode, Errors.INTERNAL_SERVER_ERROR.code)
      test.fail(`We should have thrown an error here as the apiErrorCode is ${apiErrorCode}`)
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.equal(err.apiErrorCode.code, Errors.INTERNAL_SERVER_ERROR.code)
    }
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
        extensionList: {
          extension: [
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an FSPIOPError from a Joi error with a string cause', function (test) {
    const joiError = {
      type: 'any.required',
      context: {
        label: 'Field is required'
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromJoiError(joiError, 'Stack trace...', 'dfsp1')
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '3102',
        errorDescription: 'Missing mandatory element - Field is required',
        extensionList: {
          extension: [
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
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
        errorDescription: 'Generic validation error - Unknown issue',
        extensionList: {
          extension: [
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
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
        extensionList: {
          extension: [
            {
              key: 'testKey',
              value: 'testValue'
            },
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an internal server FSPIOPError with extensionList instead of an extension', function (test) {
    const cause = new Error('Test Cause')
    const fspiopError = Factory.createInternalServerFSPIOPError('Test Internal Error', cause, 'dfsp1',
      {
        extension: [
          { key: 'testKey', value: 'testValue' }
        ]
      }
    )
    test.ok(fspiopError)
    test.ok(fspiopError.toString())
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Internal Error',
        extensionList: {
          extension: [
            {
              key: 'testKey',
              value: 'testValue'
            },
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an internal server FSPIOPError with an invalid extension', function (test) {
    const cause = new Error('Test Cause')
    try {
      Factory.createInternalServerFSPIOPError('Test Internal Error', cause, 'dfsp1', {})
      test.fail('expected validation failure due to invalid extension')
    } catch (err) {
      test.ok(err instanceof Error)
      test.deepEqual(err.message, 'FSPIOPError Parameter Validation Failure - extensions is not a list or does not contain an extension list.')
    }
    test.end()
  })

  factoryTest.test('create an FSPIOPError from a ErrorInformation object', function (test) {
    const errorInformation = {
      errorCode: '2001',
      errorDescription: 'Internal server error - Test Cause',
      extensionList: {
        extension: [
          {
            key: 'test',
            value: 'test'
          }
        ]
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromErrorInformation(errorInformation, errorInformation.errorDescription)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Cause',
        extensionList: {
          extension: [
            {
              key: 'test',
              value: 'test'
            },
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an FSPIOPError from a ErrorInformation object with extensionList containing cause', function (test) {
    const errorCause = 'FSPIOPError: Internal server error - Test Cause\n    at createFSPIOPError (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/src/factory.js:142:12)\n    at Object.createFSPIOPErrorFromErrorInformation (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/src/factory.js:251:10)\n    at Test.<anonymous> (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/test/factory.test.js:235:33)\n    at Test.bound [as _cb] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test.run (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:93:10)\n    at Test.bound [as run] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test._end (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:162:11)\n    at Test.bound [as _end] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test.<anonymous> (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:161:40)\n    at Test.emit (events.js:189:13)\nInternal server error - Test Cause'
    const errorInformation = {
      errorCode: '2001',
      errorDescription: 'Internal server error - Test Cause',
      extensionList: {
        extension: [
          {
            key: 'test',
            value: 'test'
          },
          {
            key: 'cause',
            value: errorCause.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
          }
        ]
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromErrorInformation(errorInformation, errorInformation.errorDescription)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Cause',
        extensionList: {
          extension: [
            {
              key: 'test',
              value: 'test'
            },
            {
              key: 'cause',
              value: `${fspiopError.stack}\n${errorCause}`.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an FSPIOPError from a ErrorInformation object with extensionList containing cause', function (test) {
    const errorCause = 'FSPIOPError: Internal server error - Test Cause\n    at createFSPIOPError (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/src/factory.js:142:12)\n    at Object.createFSPIOPErrorFromErrorInformation (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/src/factory.js:251:10)\n    at Test.<anonymous> (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/test/factory.test.js:235:33)\n    at Test.bound [as _cb] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test.run (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:93:10)\n    at Test.bound [as run] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test._end (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:162:11)\n    at Test.bound [as _end] (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:77:32)\n    at Test.<anonymous> (/Users/mdebarros/Documents/ModusDocs/Projects/MojaLoop/git/fork/central-services-error-handling/node_modules/tape/lib/test.js:161:40)\n    at Test.emit (events.js:189:13)\nInternal server error - Test Cause'
    const errorInformation = {
      errorCode: '2001',
      errorDescription: 'Internal server error - Test Cause',
      extensionList: {
        extension: [
          {
            key: 'test',
            value: 'test'
          },
          {
            key: 'cause',
            value: errorCause.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
          }
        ]
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromErrorInformation(errorInformation, errorInformation.errorDescription)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Cause',
        extensionList: {
          extension: [
            {
              key: 'test',
              value: 'test'
            },
            {
              key: 'cause',
              value: `${fspiopError.stack}\n${errorCause}`.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    const causeKeyValue = fspiopError.toApiErrorObject().errorInformation.extensionList.extension.find((keyValue) => keyValue.key === 'cause')
    test.equal(causeKeyValue.value.length, 128)
    test.end()
  })

  factoryTest.test('create an invalid FSPIOPError from a ErrorInformation object', function (test) {
    const errorInformation = {
      errorCode: '9999',
      errorDescription: 'Internal server error - Test Cause'
    }
    try {
      const fspiopError = Factory.createFSPIOPErrorFromErrorInformation(errorInformation)
      test.notOk(fspiopError)
      test.fail('Should have thrown an exception for an invalid error code!')
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.deepEqual(err.apiErrorCode, Errors.INTERNAL_SERVER_ERROR)
    }
    test.end()
  })

  factoryTest.test('create an FSPIOPError from an ErrorCode', function (test) {
    const errorInformation = {
      errorCode: '2001',
      errorDescription: 'Internal server error - Test Cause',
      extensionList: {
        extension: [
          {
            key: 'test',
            value: 'test'
          }
        ]
      }
    }
    const fspiopError = Factory.createFSPIOPErrorFromErrorCode(errorInformation.errorCode, undefined, errorInformation.errorDescription, null, errorInformation.extensionList)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error',
        extensionList: {
          extension: [
            {
              key: 'test',
              value: 'test'
            },
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
      }
    })
    test.end()
  })

  factoryTest.test('create an invalid FSPIOPError from an ErrorCode', function (test) {
    const errorInformation = {
      errorCode: '9999',
      errorDescription: 'Internal server error - Test Cause'
    }
    try {
      const fspiopError = Factory.createFSPIOPErrorFromErrorCode(errorInformation.errorCode)
      test.notOk(fspiopError)
      test.fail('Should have thrown an exception for an invalid error code!')
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.deepEqual(err.apiErrorCode, Errors.INTERNAL_SERVER_ERROR)
    }
    test.end()
  })

  factoryTest.test('reformat an FSPIOPError from a general error', function (test) {
    const cause = new Error('Test Cause')
    const fspiopError = Factory.reformatFSPIOPError(cause)
    test.ok(fspiopError)
    test.deepEqual(fspiopError.toApiErrorObject(), {
      errorInformation: {
        errorCode: '2001',
        errorDescription: 'Internal server error - Test Cause',
        extensionList: {
          extension: [
            {
              key: 'cause',
              value: fspiopError.stack.substring(ErrorModelTypes.ExtensionValue.constraints.min - 1, ErrorModelTypes.ExtensionValue.constraints.max) // truncate string to match Mojaloop API v1.0 Spec
            }
          ]
        }
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

  factoryTest.test('validateFSPIOPErrorCode should validate an integer errorCode', function (test) {
    const errorCode = 2000
    try {
      const result = Factory.validateFSPIOPErrorCode(errorCode)
      test.ok(result)
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.fail(err)
    }
    test.end()
  })

  factoryTest.test('validateFSPIOPErrorCode should validate an string errorCode', function (test) {
    const errorCode = `${Errors.INTERNAL_SERVER_ERROR.code}`
    try {
      const result = Factory.validateFSPIOPErrorCode(errorCode)
      test.deepEqual(result, Errors.INTERNAL_SERVER_ERROR)
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.fail(err)
    }
    test.end()
  })

  factoryTest.test('validateFSPIOPErrorCode should validate an apiErrorCode errorCode enum', function (test) {
    const errorCode = Errors.INTERNAL_SERVER_ERROR
    try {
      const result = Factory.validateFSPIOPErrorCode(errorCode)
      test.deepEqual(result, Errors.INTERNAL_SERVER_ERROR)
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.fail(err)
    }
    test.end()
  })

  factoryTest.test('validateFSPIOPErrorCode should validate an invalid apiErrorCode errorCode enum', function (test) {
    const errorCode = { test }
    try {
      const result = Factory.validateFSPIOPErrorCode(errorCode)
      test.notOk(result)
      test.fail()
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.equal(err.apiErrorCode.code, Errors.INTERNAL_SERVER_ERROR.code)
      test.equal(err.apiErrorCode.message, Errors.INTERNAL_SERVER_ERROR.message)
    }
    test.end()
  })

  factoryTest.test('validateFSPIOPErrorCode should validate an integer errorCode and throw exception', function (test) {
    const errorCode = 9999
    try {
      const result = Factory.validateFSPIOPErrorCode(errorCode)
      test.notOk(result)
      test.fail()
    } catch (err) {
      test.ok(err instanceof Factory.FSPIOPError)
      test.equal(err.apiErrorCode.code, Errors.INTERNAL_SERVER_ERROR.code)
      test.equal(err.apiErrorCode.message, Errors.INTERNAL_SERVER_ERROR.message)
    }
    test.end()
  })

  factoryTest.end()
})
