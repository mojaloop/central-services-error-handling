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

const _ = require('lodash')

const MojaloopSDKError = require('@mojaloop/sdk-standard-components').Errors

/**
 *  Mojaloop API spec error type enums
 */
const MojaloopTypes = {
  GENERIC_COMMUNICATION_ERROR: {
    regex: '^10[0-9]{2}$',
    description: 'Generic Communication Error'
  },
  GENERIC_SERVER_ERROR: {
    regex: '^20[0-9]{2}$',
    description: 'Generic Server Error'
  },
  GENERIC_CLIENT_ERROR: {
    regex: '^30[0-9]{2}$',
    description: 'Generic Client Error'
  },
  CLIENT_VALIDATION_ERROR: {
    regex: '^31[0-9]{2}$',
    description: 'Client Validation Error'
  },
  IDENTIFIER_ERROR: {
    regex: '^32[0-9]{2}$',
    description: 'Identifier Error'
  },
  EXPIRED_ERROR: {
    regex: '^33[0-9]{2}$',
    description: 'Expired Error'
  },
  PAYER_ERROR: {
    regex: '^4[0-9]{3}$',
    description: 'Payer Error'
  },
  PAYEE_ERROR: {
    regex: '^5[0-9]{3}$',
    description: 'Payee Error'
  }
}

/**
 * Returns an object representing a Mojaloop API spec error code combined with error types enums
 *
 * @param errorCodes {object} - Mojaloop API spec error code enums
 * @param errorTypes {object} - Mojaloop API spec error type enums
 * @returns {object} - Object representing the Mojaloop API spec error enums with associated types
 */
const populateErrorTypes = (errorCodes, errorTypes) => {
  const newErrorCodes = {}
  for (const [errorCodeKey, errorCodeValue] of Object.entries(errorCodes)) {
    for (const [errorTypeKey, errorTypeValue] of Object.entries(errorTypes)) {
      const regExp = new RegExp(errorTypeValue.regex)
      if (regExp.test(errorCodeValue.code)) {
        const newErrorCodeValue = _.cloneDeep(errorCodeValue)
        _.set(newErrorCodeValue, 'name', errorCodeKey)
        _.set(newErrorCodeValue, 'type', errorTypeValue)
        _.set(newErrorCodeValue, 'type.name', errorTypeKey)
        _.set(newErrorCodes, errorCodeKey, newErrorCodeValue)
      }
    }
  }
  return newErrorCodes
}

/**
 * Returns an object representing a Mojaloop API spec error code map using the error code as the key
 *
 * @param errorCodes {object} - Mojaloop API spec error code enums
 * @returns {object} - Object representing a Mojaloop API Error map using the error code as the key with each record having the associated name
 */
const errorCodesToMap = (errorCodes) => {
  const newErrorCodeMap = {}
  for (const [errorCodeKey, errorCodeValue] of Object.entries(errorCodes)) {
    const newErrorCodeValue = _.cloneDeep(errorCodeValue)
    _.set(newErrorCodeValue, 'name', errorCodeKey)
    _.set(newErrorCodeMap, errorCodeValue.code.toString(), newErrorCodeValue)
  }
  return newErrorCodeMap
}

/**
 *  Mojaloop API spec error enums with associated type enums
 */
const FSPIOPErrorCodes = populateErrorTypes(MojaloopSDKError.MojaloopApiErrorCodes, MojaloopTypes)

/**
 *  Mojaloop API spec error map enums with associated type enums by error code as the key map
 */
const FSPIOPErrorCodeMap = errorCodesToMap(FSPIOPErrorCodes)

/**
 * Returns an object representing a Mojaloop API spec error object given its error code using super fast hash lookup
 *
 * @param code {number/string} - Mojaloop API spec error code (four digit integer as number or string)
 * @returns {object} - Object representing the Mojaloop API spec error
 */
const findFSPIOPErrorCode = (code) => {
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
 *  Mojaloop API spec Model Types related to ErrorInformation
 */
const MojaloopModelTypes = {
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
  }
}

const Internal = {
  FSPIOPError: {
    ExtensionsKeys: {
      cause: '_cause'
    }
  }
}

module.exports = {
  FSPIOPErrorCodes,
  FSPIOPErrorTypes: MojaloopTypes,
  FSPIOPErrorCodeMap,
  findFSPIOPErrorCode,
  MojaloopModelTypes,
  Internal
}
