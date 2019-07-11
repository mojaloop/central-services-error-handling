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

const getReplyToFromRequestHeaders = (request) => {
  return (request.headers && request.headers['fspiop-source']) ? request.headers['fspiop-source'] : null
}

const createFSPIOPError = (cause, message, replyTo, apiErrorCode, extensions) => {
  return new FSPIOPError(cause, message, replyTo, apiErrorCode, extensions)
}

const createFSPIOPErrorFromJoiErrors = (request) => {
  const response = request.response
  const error = request.response.details[0]

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

  return createFSPIOPError(response, error.context.label, getReplyToFromRequestHeaders(request), fspiopError, [
    { key: 'cause', value: response.stack }
  ])
}

const createFSPIOPErrorFromBoomError = (request) => {
  const response = request.response

  const fspiopError = ((httpStatusCode) => {
    switch (httpStatusCode) {
      case 400:
        return Errors.CLIENT_ERROR

      case 404:
        return Errors.UNKNOWN_URI

      default:
        return Errors.SERVER_ERROR
    }
  })(response.output.statusCode)

  return createFSPIOPError(response, response.message, getReplyToFromRequestHeaders(request), fspiopError, [
    { key: 'cause', value: response.stack }
  ])
}

module.exports = {
  FSPIOPError,
  createFSPIOPError,
  createFSPIOPErrorFromJoiErrors,
  createFSPIOPErrorFromBoomError
}
