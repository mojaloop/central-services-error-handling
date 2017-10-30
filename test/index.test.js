'use strict'

const Test = require('tape')
const Sinon = require('sinon')
const Handler = require('../src/handler')
const Module = require('../src/index')
const FailAction = require('../src/fail-action')

Test('error handler module', moduleTest => {
  moduleTest.test('register should', registerTest => {
    registerTest.test('wire Handler onPreResponse method to server onPreResponse event', test => {
      let extStub = Sinon.stub()
      let server = { ext: extStub }

      let next = () => {
        test.ok(extStub.calledWith('onPreResponse', Handler.onPreResponse))
        test.end()
      }

      Module.register(server, {}, next)
    })

    registerTest.test('be named error-handler', test => {
      test.equal(Module.register.attributes.name, 'error-handler')
      test.end()
    })

    registerTest.end()
  })

  moduleTest.test('validateRoutes should', validateRoutesTest => {
    validateRoutesTest.test('return failAction and default options', test => {
      const result = Module.validateRoutes()

      test.equal(result.failAction, FailAction)
      test.equal(result.options.abortEarly, false)
      test.equal(result.options.language.key, '{{!key}} ')
      test.end()
    })

    validateRoutesTest.test('set abortEarly and language key on options and pass others', test => {
      const result = Module.validateRoutes({
        abortEarly: true,
        language: {
          key: 'not name'
        },
        others: 'others'
      })

      test.equal(result.failAction, FailAction)
      test.equal(result.options.abortEarly, false)
      test.equal(result.options.language.key, '{{!key}} ')
      test.equal(result.options.others, 'others')
      test.end()
    })

    validateRoutesTest.end()
  })

  moduleTest.end()
})

