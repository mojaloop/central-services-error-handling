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

const Enums = require('./enums')
const _ = require('lodash')
const MojaloopFSPIOPError = require('@mojaloop/sdk-standard-components').Errors.MojaloopFSPIOPError

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
    // Validate incoming params (if required)
    // TODO: Need to clarify ML API Specification for the correct model structure for the extensionList - catering for both scenarios until this can be clarified
    if (extensions && !((Array.isArray(extensions)) || (extensions.extension && Array.isArray(extensions.extension)))) throw new Error('FSPIOPError Parameter Validation Failure - extensions is not a list or does not contain an extension list.')
    if (!apiErrorCode.code && !apiErrorCode.message) throw new Error('FSPIOPError Parameter Validation Failure - apiErrorCode is not valid error code enum.')

    // Constructor logic goes here
    const clonedExtensions = _.cloneDeep(extensions) // makes sure we make a copy.
    super(cause, message, replyTo, apiErrorCode, clonedExtensions)
    this._setStackFromCause(cause)
    this.useMessageAsDescription = useMessageAsDescription
  }

  /**
   * Internal only method to set the stack trace based on the set Cause.
   * This can be used to serialise the error to a JSON body.
   *
   * @param cause {object} - Underlying error object or any type that represents the cause of this error
   */
  _setStackFromCause (cause) {
    let stringifiedCause
    if (typeof this.cause === 'string' || this.cause instanceof String) {
      stringifiedCause = this.cause
    } else if (this.cause instanceof Error) {
      stringifiedCause = this.cause.stack
    } else {
      stringifiedCause = JSON.stringify(this.cause)
    }
    if (stringifiedCause) this.stack = `${this.stack}\n${stringifiedCause}`
  }

  /**
   * Returns an object that complies with the API specification for error bodies. By default object does not contain the cause extension
   * This can be used to serialise the error to a JSON body
   *
   * @param includeCauseExtension {boolean} - Flag to specify whether or not to include cause extension at extension list
   * @param truncateCause {boolean} - Flag to specify whether or not to truncate the cause string to match Mojaloop API v1.0 Spec
   *
   * @returns {object}
   */
  toApiErrorObject ({ includeCauseExtension = false, truncateExtensions = true } = {}) {
    let errorDescription = this.apiErrorCode.message

    // Lets check if the message is defined, not null or empty (i.e. undefined).
    if ((this.message && this.message !== 'null' && this.message.length > 0) && !this.useMessageAsDescription) {
      errorDescription = `${errorDescription} - ${this.message}`
    } else if (this.useMessageAsDescription) { // Lets check to see if we must use the message as the errorDescription.
      errorDescription = `${this.message}`
    }

    const e = {
      errorInformation: {
        errorCode: this.apiErrorCode.code,
        errorDescription
      }
    }

    if (this.extensions) {
      e.errorInformation.extensionList = {}

      if (Array.isArray(this.extensions)) {
        // TODO: Need to clarify ML API Specification for the correct model structure for the extensionList - catering for both scenarios until this can be clarified
        // e.errorInformation.extensionList = _.cloneDeep(this.extensions)
        e.errorInformation.extensionList.extension = _.cloneDeep(this.extensions)
      } else if (this.extensions.extension && Array.isArray(this.extensions.extension)) {
        e.errorInformation.extensionList.extension = _.cloneDeep(this.extensions.extension)
      }

      if (includeCauseExtension === true) {
        const causeKeyValueFromExtensions = e.errorInformation.extensionList.extension.find(keyValue => keyValue.key === Enums.Internal.FSPIOPError.ExtensionsKeys.cause)
        if (causeKeyValueFromExtensions) {
          causeKeyValueFromExtensions.value = `${this.stack}\n${causeKeyValueFromExtensions.value}`
        } else {
          const causeKeyValue = {
            key: Enums.Internal.FSPIOPError.ExtensionsKeys.cause,
            value: this.stack
          }
          e.errorInformation.extensionList.extension.push(causeKeyValue)
        }
      } else if (e.errorInformation.extensionList.extension && Array.isArray(e.errorInformation.extensionList.extension)) {
        _.remove(e.errorInformation.extensionList.extension, (extensionKeyValue) => {
          return extensionKeyValue.key === Enums.Internal.FSPIOPError.ExtensionsKeys.cause
        })
        if (e.errorInformation.extensionList.extension.length === 0) {
          delete e.errorInformation.extensionList
        }
      }
    } else {
      if (includeCauseExtension === true) {
        e.errorInformation.extensionList = {
          extension: [{
            key: Enums.Internal.FSPIOPError.ExtensionsKeys.cause,
            value: this.stack
          }]
        }
      }
    }
    const hasExtension = e.errorInformation.extensionList && e.errorInformation.extensionList.extension && e.errorInformation.extensionList.extension.length
    if (truncateExtensions && hasExtension) {
      for (const i in e.errorInformation.extensionList.extension) {
        if (e.errorInformation.extensionList.extension[i].value) {
          e.errorInformation.extensionList.extension[i].value = e.errorInformation.extensionList.extension[i].value.toString().substr(0, Enums.MojaloopModelTypes.ExtensionValue.constraints.max)
        }
      }
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
 * @param useDescriptionAsMessage {boolean} - Enables concatinations of the Message & Error Description on the
 * @returns {FSPIOPError} - create the specified error, will fall back to INTERNAL_SERVER_ERROR if the apiErrorCode is undefined
 */
const createFSPIOPError = (apiErrorCode, message, cause, replyTo, extensions, useDescriptionAsMessage = false) => {
  if (apiErrorCode && apiErrorCode.code && apiErrorCode.message) {
    const newApiError = Object.assign({}, apiErrorCode)
    let match = Enums.findFSPIOPErrorCode(apiErrorCode.code)
    if (!match) {
      match = Enums.findErrorType(apiErrorCode.code)
      if (!match) {
        throw new FSPIOPError(cause, `Factory function createFSPIOPError failed due to apiErrorCode being invalid - ${JSON.stringify(apiErrorCode)}.`, replyTo, Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, extensions)
      }
      if (!newApiError.httpStatusCode) {
        newApiError.httpStatusCode = match.httpStatusCode
      }
    } else if (!newApiError.httpStatusCode) {
      newApiError.httpStatusCode = match.httpStatusCode
    }
    return new FSPIOPError(cause, message, replyTo, newApiError, extensions, useDescriptionAsMessage)
  } else {
    throw new FSPIOPError(cause, `Factory function createFSPIOPError failed due to apiErrorCode being invalid - ${JSON.stringify(apiErrorCode)}.`, replyTo, Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, extensions)
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
        return Enums.FSPIOPErrorCodes.MISSING_ELEMENT

      // Match any type that starts with 'string.'
      case (type.match(/^string\./) || {}).input:
      case 'date.format':
      case 'any.allowOnly':
        return Enums.FSPIOPErrorCodes.MALFORMED_SYNTAX

      default:
        return Enums.FSPIOPErrorCodes.VALIDATION_ERROR
    }
  })(error.type)

  const stackTrace = (cause && cause.stack)
    ? cause.stack
    : cause

  const source = (
    cause &&
    cause.output &&
    cause.output.payload &&
    cause.output.payload.validation
  ) ? cause.output.payload.validation.source
    : undefined

  const messages = {
    header: `'${error.context.label}' HTTP header`,
    params: `'${error.context.label}' URI path parameter`
  }

  // If the error was caused by a missing or invalid header or path parameter respond with
  // appropriate text indicating as much
  const msg = (source && messages[source])
    ? messages[source]
    : error.message

  return createFSPIOPError(fspiopError, msg, stackTrace, replyTo)
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
  return createFSPIOPError(Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, message, cause, replyTo, extensions)
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
const reformatFSPIOPError = (error, apiErrorCode = Enums.FSPIOPErrorCodes.INTERNAL_SERVER_ERROR, replyTo, extensions) => {
  if (error.constructor && error.constructor.name === FSPIOPError.name) {
    return error
  } else {
    return createFSPIOPError(apiErrorCode, error.message, error.stack, replyTo, extensions)
  }
}

/**
 * Factory method to create an FSPIOPError based on the errorInformation object being passed in.
 *
 * @param errorInformation {object} - Mojaloop JSON ErrorInformation object
 * @param cause {object/string} - the original Error
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @returns {FSPIOPError}
 */
const createFSPIOPErrorFromErrorInformation = (errorInformation, cause, replyTo) => {
  const errorCode = {
    code: errorInformation.errorCode,
    message: errorInformation.errorDescription
  }
  return createFSPIOPError(errorCode, errorInformation.errorDescription, cause, replyTo, errorInformation.extensionList, true)
}

/**
 * Factory method to create an FSPIOPError based on an errorCode (string or number).
 *
 * @param code {string/number} - Mojaloop Spec error code in either a string or number.
 * @param message {string} - a description of the error
 * @param cause {object/string} - the original Error
 * @param replyTo {string} - the FSP to notify of the error if applicable
 * @param extensions {object} - additional information to associate with the error
 * @returns {FSPIOPError}
 */
const createFSPIOPErrorFromErrorCode = (code, message, cause, replyTo, extensions) => {
  const errorCode = validateFSPIOPErrorCode(code)
  return createFSPIOPError(errorCode, message, cause, replyTo, extensions)
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
  const errorMessage = 'Validation failed due to error code being invalid'
  let codeToValidate
  if (typeof code === 'number' || typeof code === 'string') { // check to see if this is a normal error code represented by a number or string
    codeToValidate = code
  } else if (typeof code === 'object' && code.code) { // check to see if this is a apiErrorCode error
    codeToValidate = code.code
  }
  // validate the error code
  const result = Enums.findFSPIOPErrorCode(codeToValidate)
  if (result) {
    return result
  } else {
    throw createInternalServerFSPIOPError(`${errorMessage} - ${JSON.stringify(code)}.`)
  }
}

/**
 * Validate a code against the Mojaloop API spec, specifically custom errors, returns the incoming error code or throws an exception if invalid.
 *
 * @param code {number/string/object} - Mojaloop API spec error code (four digit integer as number or string or apiErrorCode enum)
 * @param throwException {boolean} - Mojaloop API spec error code (four digit integer as number or string)
 * @returns boolean -  if valid, true, if false then an exception will be thrown instead)
 * @throws {FSPIOPError} - Internal Server Error indicating that the error code is invalid.
 */
const validateFSPIOPErrorGroups = (code) => {
  const errorMessage = 'Validation failed due to error code being invalid'
  let codeToValidate
  if (typeof code === 'number' || typeof code === 'string') { // check to see if this is a normal error code represented by a number or string
    codeToValidate = code
  } else if (typeof code === 'object' && code.code) { // check to see if this is a apiErrorCode error
    codeToValidate = code.code
  }
  // validate the custom error code
  const regex = /^(10|20|3[0-4]|4[0-4]|5[0-4])[0-9]{2}$/
  if (regex.test(codeToValidate)) {
    return true
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
  createFSPIOPErrorFromErrorCode,
  reformatFSPIOPError,
  validateFSPIOPErrorCode,
  validateFSPIOPErrorGroups
}
