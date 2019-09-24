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
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

const Factory = require('./factory')
const Errors = require('./enums').FSPIOPErrorCodes
const ErrorHandler = require('@mojaloop/central-services-error-handling')

const getReplyToFromRequestHeaders = (request) => {
  return (request.headers && request.headers['fspiop-source']) ? request.headers['fspiop-source'] : null
}

const createFSPIOPErrorFromErrorResponse = (request, response) => {
  const fspiopError = ((httpStatusCode) => {
    switch (httpStatusCode) {
      case 400:
        return Errors.CLIENT_ERROR

      case 404:
        return Errors.UNKNOWN_URI

      default:
        return Errors.INTERNAL_SERVER_ERROR
    }
  })(response.output.statusCode)

  return Factory.createFSPIOPError(fspiopError, response.message, response, getReplyToFromRequestHeaders(request), [
    { key: 'cause', value: response.stack }
  ])
}

const reformatError = (request, response) => {
  if (!response.output) {
    response.output = {}
  }

  let fspiopError
  if (response.isJoi) {
    const replyTo = getReplyToFromRequestHeaders(request)
    fspiopError = Factory.createFSPIOPErrorFromJoiError(request.response.details[0], response, replyTo)
  } else if (response.name === 'FSPIOPError') {
    fspiopError = response
  } else {
    fspiopError = createFSPIOPErrorFromErrorResponse(request, response)
  }

  response.output.payload = fspiopError.toApiErrorObject()
  if (fspiopError.httpStatusCode) {
    response.output.statusCode = fspiopError.httpStatusCode
  }

  if (!response.output.statusCode) {
    response.output.statusCode = 500
  }
}

/**
 * Function to be used to handle the 'onPreResponse' Hapi server extension.
 * This reformats the standard Boom and Joi error output to a compliant error
 * format as per section 7.6 of "API Definition v1.0.docx".
 *
 * @param request the http request
 * @param reply
 * @returns {boolean|reply.continue|continue|((key?: IDBValidKey) => void)}
 */
exports.onPreResponse = function (request, reply) {
  const response = request.response
  if (response instanceof Error || response.isBoom) {
    reformatError(request, response)
  }

  return reply.continue
}

/**
 * Function to be used to handle the 'onPreHandler' Hapi server extension.
 * This validates the error is a FSPIOPError and that it contains a valid error code
 * format as per section 7.6 of "API Definition v1.0.docx".
 *
 * @param request the http request
 * @param h
 * @returns {boolean|h.continue|continue|((key?: IDBValidKey) => void)}
 */
exports.onPreHandler = function (request, h) {
  // TODO: Do we need the commented out try/catch?
  // try {
  const incomingErrorCode = request.payload.errorInformation.errorCode
  if (ErrorHandler.ValidateFSPIOPErrorCode(incomingErrorCode) != null) {
    return h
      .response(ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.VALIDATION_ERROR, `The incoming error code: ${incomingErrorCode} is not a valid mojaloop specification error code`).toApiErrorObject())
      .code(400)
      .takeover()
  }
  // } catch (err) {
  //   return h
  //     .response(`The incoming error code: ${incomingErrorCode} is not a valid mojaloop specification error code`)
  //     .code(400)
  //     .takeover()
  // }
}
