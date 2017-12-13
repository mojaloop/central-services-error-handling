'use strict'

const Shared = require('@mojaloop/central-services-shared')
const ErrorCategory = Shared.ErrorCategory

const reformatBoomError = (response) => {
  let errorId = response.output.payload.error.replace(/ /gi, '')
  errorId += (errorId.endsWith('Error')) ? '' : 'Error'
  response.output.payload = {
    id: errorId,
    message: response.output.payload.message || response.message
  }
}

exports.onPreResponse = (request, reply) => {
  let response = request.response
  if (response.isBoom) {
    if (response.category) {
      response.output.statusCode = ErrorCategory.getStatusCode(response.category)
      response.output.payload = response.payload
      response.output.headers = response.headers
    } else {
      reformatBoomError(response)
    }
  }

  return reply.continue()
}
