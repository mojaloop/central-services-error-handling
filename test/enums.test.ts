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
 - Juan Correa <juan.correa@modusbox.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

import * as ErrorEnums from '../src/enums'
import { describe, test, expect } from '@jest/globals'

describe('Enum', () => {
  test('should return correct error code string', () => {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    expect(fspiopErrorCode).toBeTruthy()
    expect(fspiopErrorCode?.code).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    expect(fspiopErrorCode?.message).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
  })

  test('should return correct error code integer', () => {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(parseInt(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code))
    expect(fspiopErrorCode).toBeTruthy()
    expect(fspiopErrorCode?.code).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    expect(fspiopErrorCode?.message).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
  })

  test('should return undefined result with incorrect error code', () => {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(parseInt('9999'))
    expect(fspiopErrorCode).toBeUndefined()
  })

  test('FSPIOPErrorTypes are correctly added to FSPIOPErrorCodes by validating each entry by its associated regex', () => {
    const fspiopErrorCode = ErrorEnums.findFSPIOPErrorCode(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    for (const errorCodeValue of Object.values(ErrorEnums.FSPIOPErrorCodes)) {
      const regExp = new RegExp(errorCodeValue.type.regex)
      expect(regExp.test(errorCodeValue.code)).toBe(true)
    }
    expect(fspiopErrorCode).toBeTruthy()
    expect(fspiopErrorCode?.code).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.code)
    expect(fspiopErrorCode?.message).toBe(ErrorEnums.FSPIOPErrorCodes.PAYEE_FSP_INSUFFICIENT_LIQUIDITY.message)
  })

  test('FSPIOPErrorCodeMaps contains every error found in the FSPIOPErrorCodes object using the findFSPIOPErrorCode method', () => {
    for (const errorCodeValue of Object.values(ErrorEnums.FSPIOPErrorCodes)) {
      const errorCodeResult = ErrorEnums.findFSPIOPErrorCode(errorCodeValue.code)
      expect(errorCodeResult).toBeTruthy()
    }
  })

  test('populateOverrides redefines existing errors and allows adding new errors', () => {
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

    const result = ErrorEnums.populateOverrides(errorCodes, override)
    expect(result).toEqual(expected)
  })
})
