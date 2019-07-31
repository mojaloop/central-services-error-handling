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

const ErrorEnums = require('./enums')
const _ = require('lodash')
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
   * Constructs a new error object
   *
   * @param cause {object} - Underlying error object or any type that represents the cause of this error
   * @param message {string} - A friendly error message
   * @param replyTo {string} - FSPID of the participant to whom this error is addressed
   * @param apiErrorCode {object} - The MojaloopApiErrorCodes object representing the API spec error
   * @param extensions {object} - API spec extensions object (if applicable)
   * @param useMessageAsDescription {boolean} - Use the message as the Error description. This is useful when converting errorInformation objects into FSPIOPErrors.
   */
  constructor (cause, message, replyTo, apiErrorCode, extensions, useMessageAsDescription = false) {
    const clonedExtensions = _.cloneDeep(extensions) // makes sure we make a copy.
    super(cause, message, replyTo, apiErrorCode, clonedExtensions)
    this.useMessageAsDescription = useMessageAsDescription
  }

  /**
   * Returns an object that complies with the API specification for error bodies.
   * This can be used to serialise the error to a JSON body
   *
   * @returns {object}
   */
  toApiErrorObject () {
    let errorDescription = this.apiErrorCode.message

    if (this.message && !this.useMessageAsDescription) {
      errorDescription = `${errorDescription} - ${this.message}`
    } else if (this.useMessageAsDescription) {
      errorDescription = `${this.message}`
    }

    const e = {
      errorInformation: {
        errorCode: this.apiErrorCode.code,
        errorDescription
      }
    }

    if (this.extensions) {
      e.errorInformation.extensionList = _.cloneDeep(this.extensions)
    }

    if (this.cause) {
      let stringifiedCause
      if (typeof this.cause === 'string' || this.cause instanceof String) {
        stringifiedCause = this.cause
      } else if (this.cause instanceof Error) {
        stringifiedCause = JSON.stringify(this.cause, Object.getOwnPropertyNames(this.cause))
      } else {
        stringifiedCause = JSON.stringify(this.cause)
      }
      const errorCause = {
        key: 'cause',
        value: stringifiedCause
      }
      if (!this.extensions) {
        e.errorInformation.extensionList = []
      }
      e.errorInformation.extensionList.push(errorCause)
    }

    return e
  }

  toString () {
    return JSON.stringify(this.toFullErrorObject())
  }
}

/**
 * Factory method to create a new FSPIOPError.
 *
 * @param apiErrorCode {object} - the FSPIOP Error enum
 * @param message {string} - a description of the error
 * @param cause {object/string} - the original Error
 * @param replyTo {string} - the FSP to notify of the error
 * @param extensions {object} - additional information to associate with the error
 * @param dontConcatMessageAndDescription {boolean} - Enables concatinations of the Message & Error Description on the
 * @returns {FSPIOPError} - create the specified error, will fall back to INTERNAL_SERVER_ERROR if the apiErrorCode is undefined
 */
const createFSPIOPError = (apiErrorCode, message, cause, replyTo, extensions, useDescriptionAsMessage) => {
  if (apiErrorCode && ErrorEnums.findFSPIOPErrorCode(apiErrorCode.code)) {
    return new FSPIOPError(cause, message, replyTo, apiErrorCode, extensions, useDescriptionAsMessage)
  } else {
    throw new FSPIOPError(cause, `Factory function createFSPIOPError failed due to apiErrorCode being invalid - ${JSON.stringify(apiErrorCode)}.`, replyTo, ErrorEnums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, extensions)
  }
}

/**
 * Factory method to create an FSPIOPError from a Joi error.
 *
 * @param error {Error} - the Joi error
 * @param cause {object/string} - an Error to use as the cause of the error if available
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @returns {FSPIOPError}
 */
const createFSPIOPErrorFromJoiError = (error, cause, replyTo) => {
  const fspiopError = ((type) => {
    switch (type) {
      case 'any.required':
      case 'any.empty':
        return ErrorEnums.FSPIOPErrorCodes.MISSING_ELEMENT

      // Match any type that starts with 'string.'
      case (type.match(/^string\./) || {}).input:
      case 'date.format':
        return ErrorEnums.FSPIOPErrorCodes.MALFORMED_SYNTAX

      default:
        return ErrorEnums.FSPIOPErrorCodes.VALIDATION_ERROR
    }
  })(error.type)

  let stackTrace
  if (cause && cause.stack) {
    stackTrace = cause.stack
  } else {
    stackTrace = cause
  }

  return createFSPIOPError(fspiopError, error.context.label, stackTrace, replyTo)
}

/**
 * Convenience factory method to create a FSPIOPError Internal Server Error
 *
 * @param message {string} - a description of the error
 * @param cause {object/string} - the original Error
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @param extensions {object} - additional information to associate with the error
 * @returns {FSPIOPError}
 */
const createInternalServerFSPIOPError = (message, cause, replyTo, extensions) => {
  return createFSPIOPError(ErrorEnums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, message, cause, replyTo, extensions)
}

/**
 * Factory method to reformat an FSPIOPError based on the erro being passed in.
 * If the error passed in is an FSPIOPError it will be returned as is.
 * If the error is any other error it will be wrapped in an FSPIOPError using the original error message
 * and error stack trace.
 *
 * @param error the error to reformat
 * @param apiErrorCode {object} - the FSPIOP Error enum, defaults to INTERNAL_SERVER_ERROR
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @param extensions {object} - additional information to associate with the error
 * @returns {FSPIOPError}
 */
const reformatFSPIOPError = (error, apiErrorCode = ErrorEnums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, replyTo, extensions) => {
  if (error instanceof FSPIOPError) {
    return error
  } else {
    return createFSPIOPError(apiErrorCode, error.message, error.stack, replyTo, extensions)
  }
}

/**
 * Factory method to create an FSPIOPError based on the errorInformation object being passed in.
 *
 * @param errorInformation {object} - Mojaloop JSON ErrorInformation object
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @returns {FSPIOPError}
 */
const createFSPIOPErrorFromErrorInformation = (errorInformation, replyTo) => {
  const errorCode = validateFSPIOPErrorCode(errorInformation.errorCode)
  return createFSPIOPError(errorCode, errorInformation.errorDescription, errorInformation.errorDescription, replyTo, errorInformation.extensionList, true)
}

/**
 * Validate a code against the Mojaloop API spec, returns the enum or throws an exception if invalid.
 *
 * @param code {number/string/object} - Mojaloop API spec error code (four digit integer as number or string or apiErrorCode enum)
 * @param throwException {boolean} - Mojaloop API spec error code (four digit integer as number or string)
 * @returns apiErrorCode {object} -  if valid, false if not (unless throwException is true, then an exception will be thrown instead)
 * @throws {FSPIOPError} - Internal Server Error indicating that the error code is invalid.
 */
const validateFSPIOPErrorCode = (code) => {
  const errorMessage = 'Validation for failed due to error code being invalid'
  let codeToValidate
  if (typeof code === 'number' || typeof code === 'string') { // check to see if this is a normal error code represented by a number or string
    codeToValidate = code
  } else if (typeof code === 'object' && code.code) { // check to see if this is a apiErrorCode error
    codeToValidate = code.code
  }
  // validate the error code
  const result = ErrorEnums.findFSPIOPErrorCode(codeToValidate)
  if (result) {
    return result
  } else {
    throw createInternalServerFSPIOPError(`${errorMessage} - ${JSON.stringify(code)}.`)
  }
}

module.exports = {
  FSPIOPError,
  createFSPIOPError,
  createFSPIOPErrorFromJoiError,
  createInternalServerFSPIOPError,
  createFSPIOPErrorFromErrorInformation,
  reformatFSPIOPError,
  validateFSPIOPErrorCode
}
