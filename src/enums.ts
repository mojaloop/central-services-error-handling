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

'use strict'

import _ from 'lodash'
import { MojaloopApiErrorCodes } from './errors'

/**
 *  Mojaloop API spec error type enums
 */
export interface MojaloopType {
  regex: string
  description: string
  httpStatusCode: number
}

export const MojaloopTypes: Record<string, MojaloopType> = {
  GENERIC_COMMUNICATION_ERROR: {
    regex: '^10[0-9]{2}$',
    description: 'Generic Communication Error',
    httpStatusCode: 503
  },
  GENERIC_SERVER_ERROR: {
    regex: '^20[0-9]{2}$',
    description: 'Generic Server Error',
    httpStatusCode: 500
  },
  GENERIC_CLIENT_ERROR: {
    regex: '^30[0-9]{2}$',
    description: 'Generic Client Error',
    httpStatusCode: 400
  },
  CLIENT_VALIDATION_ERROR: {
    regex: '^31[0-9]{2}$',
    description: 'Client Validation Error',
    httpStatusCode: 400
  },
  IDENTIFIER_ERROR: {
    regex: '^32[0-9]{2}$',
    description: 'Identifier Error',
    httpStatusCode: 400
  },
  EXPIRED_ERROR: {
    regex: '^33[0-9]{2}$',
    description: 'Expired Error',
    httpStatusCode: 400
  },
  GENERIC_PAYER_ERROR: {
    regex: '^40[0-9]{2}$',
    description: 'Generic Payer Error',
    httpStatusCode: 400
  },
  PAYER_REJECTION_ERROR: {
    regex: '^41[0-9]{2}$',
    description: 'Payer Rejection Error',
    httpStatusCode: 400
  },
  PAYER_LIMIT_ERROR: {
    regex: '^42[0-9]{2}$',
    description: 'Payer Limit Error',
    httpStatusCode: 400
  },
  PAYER_PERMISSION_ERROR: {
    regex: '^43[0-9]{2}$',
    description: 'Payer Permission Error',
    httpStatusCode: 400
  },
  PAYER_BLOCKED_ERROR: {
    regex: '^44[0-9]{2}$',
    description: 'Payer Blocker Error',
    httpStatusCode: 400
  },
  GENERIC_PAYEE_ERROR: {
    regex: '^50[0-9]{2}$',
    description: 'Generic Payee Error',
    httpStatusCode: 400
  },
  PAYEE_REJECTION_ERROR: {
    regex: '^51[0-9]{2}$',
    description: 'Payee Rejection Error',
    httpStatusCode: 400
  },
  PAYEE_LIMIT_ERROR: {
    regex: '^52[0-9]{2}$',
    description: 'Payee Limit Error',
    httpStatusCode: 400
  },
  PAYEE_PERMISSION_ERROR: {
    regex: '^53[0-9]{2}$',
    description: 'Payee Permission Error',
    httpStatusCode: 400
  },
  PAYEE_BLOCKED_ERROR: {
    regex: '^54[0-9]{2}$',
    description: 'Payee Blocker Error',
    httpStatusCode: 400
  },
  GENERIC_SETTLEMENT_ERROR: {
    regex: '^60[0-9]{2}$',
    description: 'Settlement Related Error',
    httpStatusCode: 400
  }
}

/**
 *  Mojaloop API Error Codes Override
 */
export const MojaloopApiErrorCodesOverride: Record<string, any> = {
  GENERIC_SETTLEMENT_ERROR: { code: '6000', description: 'Generic Settlement Error', message: 'Generic Settlement Error' }
  // INTERNAL_SERVER_ERROR: { httpStatusCode: 500 },
  // CUSTOM_ERROR: { code: '3241', description: 'Error text' }
}

/**
 * Returns an object representing a Mojaloop API spec error code combined with overrides
 */
export const populateOverrides = (errorCodes: Record<string, any>, override: Record<string, any>): Record<string, any> => {
  const newErrorCodes = _.cloneDeep(errorCodes)
  for (const [overrideKey, overrideValue] of Object.entries(override)) {
    if (newErrorCodes[overrideKey]) {
      for (const [key, value] of Object.entries(overrideValue)) {
        _.set(newErrorCodes[overrideKey], key, value)
      }
    } else {
      _.set(newErrorCodes, overrideKey, overrideValue)
    }
  }
  return newErrorCodes
}

/**
 * Returns an object representing a Mojaloop API spec error code combined with error types enums
 */
export const populateErrorTypes = (errorCodes: Record<string, any>, errorTypes: Record<string, MojaloopType>): Record<string, any> => {
  const newErrorCodes: Record<string, any> = {}
  for (const [errorCodeKey, errorCodeValue] of Object.entries(errorCodes)) {
    for (const [errorTypeKey, errorTypeValue] of Object.entries(errorTypes)) {
      const regExp = new RegExp(errorTypeValue.regex)
      if (regExp.test(errorCodeValue.code)) {
        const newErrorCodeValue = _.cloneDeep(errorCodeValue)
        _.set(newErrorCodeValue, 'name', errorCodeKey)
        _.set(newErrorCodeValue, 'type', errorTypeValue)
        _.set(newErrorCodeValue, 'type.name', errorTypeKey)
        if (_.get(newErrorCodeValue, 'httpStatusCode') === undefined) {
          _.set(newErrorCodeValue, 'httpStatusCode', errorTypeValue.httpStatusCode)
        }
        _.set(newErrorCodes, errorCodeKey, newErrorCodeValue)
      }
    }
  }
  return newErrorCodes
}

/**
 * Returns an object representing a Mojaloop API spec error code map using the error code as the key
 */
export const errorCodesToMap = (errorCodes: Record<string, any>): Record<string, any> => {
  const newErrorCodeMap: Record<string, any> = {}
  for (const [errorCodeKey, errorCodeValue] of Object.entries(errorCodes)) {
    const newErrorCodeValue = _.cloneDeep(errorCodeValue)
    _.set(newErrorCodeValue, 'name', errorCodeKey)
    _.set(newErrorCodeMap, errorCodeValue.code.toString(), newErrorCodeValue)
  }
  return newErrorCodeMap
}

/**
 *  Mojaloop API spec error enums with merged overrides
 */
export let FSPIOPErrorCodes = populateOverrides(MojaloopApiErrorCodes, MojaloopApiErrorCodesOverride)

/**
 *  Mojaloop API spec error enums with associated type enums
 */
FSPIOPErrorCodes = populateErrorTypes(FSPIOPErrorCodes, MojaloopTypes)

/**
 *  Mojaloop API spec error map enums with associated type enums by error code as the key map
 */
export const FSPIOPErrorCodeMap = errorCodesToMap(FSPIOPErrorCodes)

/**
 * Returns an object representing a Mojaloop API spec error object given its error code using super fast hash lookup
 */
export const findFSPIOPErrorCode = (code: number | string): any | undefined => {
  let ec
  if (code) {
    const stringCodeValue = code.toString()
    ec = FSPIOPErrorCodeMap[stringCodeValue]
  }

  if (ec) {
    return ec
  }
  return undefined
}

/**
 * Returns an object representing a Mojaloop API spec error code combined with error types enums
 */
export const findErrorType = (errorCode: string | number): MojaloopType & { name: string } | undefined => {
  for (const [errorTypeKey, errorTypeValue] of Object.entries(MojaloopTypes)) {
    const regExp = new RegExp(errorTypeValue.regex)
    if (regExp.test(errorCode.toString())) {
      const newErrorCodeType = _.cloneDeep(errorTypeValue)
      _.set(newErrorCodeType, 'name', errorTypeKey)
      return newErrorCodeType as MojaloopType & { name: string }
    }
  }
  return undefined
}

/**
 *  Mojaloop API spec Model Types related to ErrorInformation
 */
export const MojaloopModelTypes = {
  ExtensionKey: {
    cardinality: 1,
    type: 'string',
    constraints: {
      min: 1,
      max: 32
    }
  },
  ExtensionValue: {
    cardinality: 1,
    type: 'string',
    constraints: {
      min: 1,
      max: 128
    }
  },
  ErrorInformation: {
    ErrorCode: {
      cardinality: 1,
      type: 'string',
      constraints: {
        min: 4,
        max: 4
      }
    },
    ErrorDescription: {
      cardinality: 1,
      type: 'string',
      constraints: {
        min: 1,
        max: 128
      }
    }
  }
}

export const Internal = {
  FSPIOPError: {
    ExtensionsKeys: {
      cause: 'cause',
      _cause: '_cause'
    }
  }
}
