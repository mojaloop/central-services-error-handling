'use strict'

const Test = require('tape')
const Boom = require('boom')

const Handler = require('../src/handler')

Test('Handler', handlerTest => {
  handlerTest.test('onPreResponse should', preResponse => {
    preResponse.test('handle non error responses', async function (test) {
      let response = {
        isBoom: false
      }
      test.ok(Handler.onPreResponse({ response: response }, { continue: true }))
      test.end()
    })

    preResponse.test('handle Boom errors', async function (test) {
      let response = {
        isBoom: true,
        output:
        {
          payload:
          {
            error: 'BadRequest'
          }
        }
      }
      Handler.onPreResponse({ response: response, headers: [] }, {})
      test.equal(response.output.payload.errorInformation.errorCode, '2000')
      test.end()
    })

    preResponse.test('handle JOI validation errors', async function (test) {
      let response = {
        isBoom: true,
        isJoi: true,
        details: [{
          type: 'string.regex.base',
          context: {
            label: 'Regular expression failed'
          }
        }]
      }
      Handler.onPreResponse({ response: response }, {})
      test.equal(response.output.payload.errorInformation.errorDescription, 'Malformed syntax - Regular expression failed')
      test.equal(response.output.payload.errorInformation.errorCode, '3101')
      test.end()
    })

    preResponse.test('handle Boom generated errors', async function (test) {
      let response = Boom.badRequest('some bad parameters')

      Handler.onPreResponse({ response }, {})
      test.equal(response.output.statusCode, 400)
      test.equal(response.output.payload.errorInformation.errorCode, '3000')
      test.equal(response.output.payload.errorInformation.errorDescription, 'Client error - some bad parameters')
      test.end()
    })
    preResponse.end()
  })

  handlerTest.end()
})
