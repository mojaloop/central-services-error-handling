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

const Errors = require('./enums').FSPIOPErrorCodes
const MojaloopFSPIOPError = require('@modusbox/mojaloop-sdk-standard-components').Errors.MojaloopFSPIOPError

class FSPIOPError extends MojaloopFSPIOPError {
  /**
   * Returns an object that complies with the API specification for error bodies.
   * This can be used to serialise the error to a JSON body
   *
   * @returns {object}
   */
  toApiErrorObject () {
    let errorDescription = this.apiErrorCode.message

    if (this.message) {
      errorDescription = `${errorDescription} - ${this.message}`
    }

    let e = {
      errorInformation: {
        errorCode: this.apiErrorCode.code,
        errorDescription
      }
    }

    if (this.extensions) {
      e.errorInformation.extensionList = this.extensions
    }

    return e
  }
}

const createFSPIOPError = (cause, message, replyTo, apiErrorCode, extensions) => {
  return new FSPIOPError(cause, message, replyTo, apiErrorCode, extensions)
}

const createFSPIOPErrorFromJoiErrors = (errors) => {
  // TODO construct the error using the Joi data (if Joi)
  // TODO add cause to the extensions list if there is one, key to be 'cause'
  let apiErrorCode = ((type) => {
    switch (type) {
      case 'any.required':
      case 'any.empty':
        return Errors.MISSING_ELEMENT

      // Match any type that starts with 'string.'
      case (type.match(/^string\./) || {}).input:
      case 'date.format':
        return Errors.MALFORMED_SYNTAX

      default:
        return Errors.VALIDATION_ERROR
    }
  })(errors[0].type)

  return createFSPIOPError(errors, errors[0].context.label, null, apiErrorCode, [
    // { key: 'cause', value: errors[0].cause ? errors[0].cause.stack || util.inspect(errors[0].cause) : undefined }
  ])
}

module.exports = {
  FSPIOPError,
  createFSPIOPError,
  createFSPIOPErrorFromJoiErrors
}
