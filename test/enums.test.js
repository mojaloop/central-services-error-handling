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
const ErrorEnums = require('../src/enums')

Test('Enum should', enumTest => {
  enumTest.test('return correct error code string', function (test) {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    test.ok(fspiopErrorCode)
    test.equal(fspiopErrorCode.code, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    test.equal(fspiopErrorCode.message, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
    test.end()
  })

  enumTest.test('return correct error code integer', function (test) {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(parseInt(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code))
    test.ok(fspiopErrorCode)
    test.equal(fspiopErrorCode.code, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    test.equal(fspiopErrorCode.message, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
    test.end()
  })

  enumTest.test('return undefined result with incorrect error code', function (test) {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(parseInt('9999'))
    test.equals(fspiopErrorCode, undefined)
    test.end()
  })

  enumTest.test('test FSPIOPErrorTypes are correctly added to FSPIOPErrorCodes by validating each entry by its associated regex', function (test) {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    for (const errorCodeValue of Object.values(ErrorEnums.FSPIOPErrorCodes)) {
      const regExp = new RegExp(errorCodeValue.type.regex)
      test.ok(regExp.test(errorCodeValue.code))
    }
    test.ok(fspiopErrorCode)
    test.equal(fspiopErrorCode.code, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    test.equal(fspiopErrorCode.message, ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
    test.end()
  })

  enumTest.test('test FSPIOPErrorCodeMaps contains every error found in the FSPIOPErrorCodes object using the findFSPIOPErrorCode method', function (test) {
    for (const errorCodeValue of Object.values(ErrorEnums.FSPIOPErrorCodes)) {
      const errorCodeResult = ErrorEnums.findFSPIOPErrorCode(errorCodeValue.code)
      test.ok(errorCodeResult)
    }
    test.end()
  })

  enumTest.test('populateOverrides redefines existing errors and allows adding new errors', function (test) {
    const errorCodes = {
      INTERNAL_SERVER_ERROR: { code: '2001', message: 'Internal Server Error' }
    }
    const override = {
      INTERNAL_SERVER_ERROR: { code: '9000' },
      NEW_CUSTOM_ERROR: { code: '9001', message: 'Custom Error' }
    }
    const expected = {
      INTERNAL_SERVER_ERROR: { code: '9000', message: 'Internal Server Error' },
      NEW_CUSTOM_ERROR: { code: '9001', message: 'Custom Error' }
    }

    const result = ErrorEnums._populateOverrides(errorCodes, override)
    test.deepEqual(result, expected)
    test.end()
  })

  enumTest.end()
})
