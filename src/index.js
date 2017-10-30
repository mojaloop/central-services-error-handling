'use strict'

const Handler = require('./handler')
const FailAction = require('./fail-action')
const ValidationErrors = require('./validation-errors')

exports.register = (server, options, next) => {
  server.ext('onPreResponse', Handler.onPreResponse)
  next()
}

exports.register.attributes = {
  name: 'error-handler'
}

exports.validateRoutes = (options = {}) => {
  options.abortEarly = false
  let language = options.language || {}
  language.key = '{{!key}} '
  options.language = language
  return {
    failAction: FailAction,
    options: options
  }
}

exports.InvalidBodyError = ValidationErrors.InvalidBodyError
exports.InvalidQueryParameterError = ValidationErrors.InvalidQueryParameterError
exports.InvalidUriParameterError = ValidationErrors.InvalidUriParameterError
exports.InvalidHeaderError = ValidationErrors.InvalidHeaderError
