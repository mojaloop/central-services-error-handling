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

/**
 * See section 7.6 of "API Definition v1.0.docx". Note that some of the these
 * error objects contain an httpStatusCode property that indicates the HTTP
 * response code for cases where errors are returned immediately i.e. upon
 * request, rather than on callback.  Those error objects that do not contain
 * an httpStatusCode property are expected to only be returned to callers in
 * error callbacks after the initial request was accepted with a 202/200.
 */
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

/**
 * Factory method to create a new FSPIOPError.
 *
 * @param cause the original Error
 * @param message a description of the error
 * @param replyTo the FSP to notify of the error
 * @param apiErrorCode the FSPIOP Error enum
 * @param extensions additional information to associate with the error
 * @returns {FSPIOPError}
 */
const createFSPIOPError = (cause, message, replyTo, apiErrorCode, extensions) => {
  return new FSPIOPError(cause, message, replyTo, apiErrorCode, extensions)
}

/**
 * Factory method to create an FSPIOPError from a Joi error.
 *
 * @param error the Joi error
 * @param cause an Error to use as the cause of the error if available
 * @param replyTo the FSP to notify of the error if applicable
 * @returns {FSPIOPError}
 */
const createFSPIOPErrorFromJoiError = (error, cause, replyTo) => {
  let fspiopError = ((type) => {
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
  })(error.type)

  let extensions
  if (cause) {
    extensions = [{ key: 'cause', value: cause.stack }]
  }

  return createFSPIOPError(cause, error.context.label, replyTo, fspiopError, extensions)
}

module.exports = {
  FSPIOPError,
  createFSPIOPError,
  createFSPIOPErrorFromJoiError
}
