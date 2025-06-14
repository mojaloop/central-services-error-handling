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
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

import * as Factory from './factory'
import { FSPIOPErrorCodes as Errors } from './enums'
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'

type HapiRequest = Request & {
  response: any
  server: any
  path: string
  headers: Record<string, string>
  payload?: any
}

type HapiReply = {
  continue: symbol
}

const getReplyToFromRequestHeaders = (request: HapiRequest): string | null => {
  return (request.headers && request.headers['fspiop-source']) ? request.headers['fspiop-source'] : null
}

const createFSPIOPErrorFromErrorResponse = (request: HapiRequest, response: any): any => {
  const fspiopError = ((response: any, request: HapiRequest) => {
    switch (response.output.statusCode) {
      case 400:
        return Errors.CLIENT_ERROR
      case 404: {
        const matches = findMatches(request)

        if (matches.length > 0) {
          const allowedHeaderValues = getAllowHeaders(matches)
          response.message = ''
          response.output.headers.Allow = allowedHeaderValues
          return Errors.METHOD_NOT_ALLOWED
        } else {
          return Errors.UNKNOWN_URI
        }
      }
      case 415:
        return Errors.MALFORMED_SYNTAX

      default:
        return Errors.INTERNAL_SERVER_ERROR
    }
  })(response, request)

  return Factory.createFSPIOPError(fspiopError, response.message, response.stack, getReplyToFromRequestHeaders(request) ?? undefined)
}

type Match = { method: string }

const findMatches = (request: HapiRequest): Match[] => {
  const server = request.server
  const path = request.path
  const matches: Match[] = []
  const methods = ['get', 'post', 'put', 'patch', 'delete']

  for (const method of methods) {
    const match = server.match(method, path)
    if (match != null) {
      const data = { method: match.method }
      matches.push(data)
    }
  }

  return matches
}

const getAllowHeaders = (matches: Match[]): string => {
  let headers = ''

  for (const match of matches) {
    const method = match.method

    if (headers === '') {
      headers += method
    } else {
      headers += ',' + method
    }
  }

  return headers
}

const reformatError = (request: HapiRequest, response: any): void => {
  if (!response.output) {
    response.output = {}
  }

  let fspiopError
  if (response.isJoi) {
    const replyTo = getReplyToFromRequestHeaders(request)
    fspiopError = Factory.createFSPIOPErrorFromJoiError(request.response.details[0], response, replyTo ?? undefined)
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
const onPreResponse = (request: HapiRequest, reply: HapiReply): symbol => {
  const response = request.response
  if (response instanceof Error || response.isBoom) {
    reformatError(request, response)
  }

  return reply.continue
}

/**
 * Function to be used to handle the 'validateIncomingErrorCode' Hapi server extension.
 * This validates the error is a FSPIOPError and that it contains a valid error code
 * format as per section 7.6 of "API Definition v1.0.docx".
 *
 * @param request the http request
 * @param h
 * @returns {boolean|h.continue|continue|((key?: IDBValidKey) => void)}
 */
const validateIncomingErrorCode = (request: HapiRequest, h: ResponseToolkit): symbol | ResponseObject => {
  const incomingErrorCode = request.payload?.errorInformation?.errorCode
  try {
    if (Factory.validateFSPIOPErrorCode(incomingErrorCode).code === incomingErrorCode) {
      return h.continue
    }
  } catch (err) {
    try {
      if (Factory.validateFSPIOPErrorGroups(incomingErrorCode)) {
        return h.continue
      }
    } catch (err) {
      const onPreHandlerApiErrorObject = Factory.createFSPIOPError(
        Errors.VALIDATION_ERROR,
        `The incoming error code: ${incomingErrorCode} is not a valid mojaloop specification error code`
      ).toApiErrorObject()
      return h
        .response(onPreHandlerApiErrorObject)
        .code(400)
        .takeover()
    }
  }
  return h.continue
}

export {
  validateIncomingErrorCode,
  onPreResponse,
  createFSPIOPErrorFromErrorResponse,
  getAllowHeaders,
  findMatches
}
