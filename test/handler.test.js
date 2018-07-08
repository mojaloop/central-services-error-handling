'use strict'

const Test = require('tape')
const Boom = require('boom')

const Handler = require('../src/handler')
const Shared = require('@mojaloop/central-services-shared')
const BaseError = Shared.BaseError
const ErrorCategory = Shared.ErrorCategory

let TestError = class extends BaseError {
  constructor (message) {
    super(ErrorCategory.UNPROCESSABLE, message)
  }
}

Test('error handler', handlerTest => {
  handlerTest.test('onPreResponse should', preResponse => {
    preResponse.test('do nothing if response not boom', async function (test) {
      let response = {isBoom: false}

      Handler.onPreResponse({response: response}, {})
      test.deepEqual(response, {isBoom: false})
      test.end()
    })

    preResponse.test('handle boom wrapped errors with category property', async function (test) {
      let message = 'test'
      let error = new TestError(message)
      let response = Boom.badData(error)
      let request = {
        response: response
      }

      Handler.onPreResponse(request, {})
      test.equal(response.output.statusCode, 422)
      test.equal(response.output.payload.id, 'TestError')
      test.equal(response.output.payload.message, message)
      test.deepEqual(response.output.headers, {})
      test.end()
    })

    preResponse.test('reformat boom defined errors', async function (test) {
      let message = 'some bad parameters'
      let response = Boom.badRequest('some bad parameters')

      Handler.onPreResponse({response}, {})
      test.equal(response.output.statusCode, 400)
      test.equal(response.output.payload.id, 'BadRequestError')
      test.equal(response.output.payload.message, message)
      test.end()
    })

    preResponse.test('return reasonable defaults', async function (test) {
      let error = new Error(undefined)
      let response = Boom.badImplementation(error)
      response.output.payload.message = null
      response.message = 'An internal server error occurred'
      Handler.onPreResponse({response: response}, {})
      test.equal(response.output.statusCode, 500)
      test.equal(response.output.payload.id, 'InternalServerError')
      test.equal(response.output.payload.message, 'An internal server error occurred')
      test.end()
    })
    preResponse.end()
  })

  handlerTest.end()
})
