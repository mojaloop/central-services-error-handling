'use strict'

const Test = require('tape')

const FailAction = require('../src/fail-action')
const ValidationErrors = require('../src/validation-errors')

Test('FailAction should', failActionTest => {
  failActionTest.test('continue reply if not error', test => {
    const reply = {
      continue: () => {
        test.pass()
        test.end()
      }
    }
    FailAction({}, reply)
  })

  failActionTest.test('reply with error if error does not contain data', test => {
    const error = new Error()
    const reply = (err) => {
      test.equal(err, error)
      test.end()
    }

    FailAction({}, reply, '', error)
  })

  failActionTest.test('reply with error if error data is not ValidationError', test => {
    const error = {
      data: new Error()
    }
    const reply = (err) => {
      test.equal(err, error)
      test.end()
    }
    FailAction({}, reply, '', error)
  })

  failActionTest.test('reply with InvalidBodyError if source is payload and error data is ValidationError', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.ok(err instanceof ValidationErrors.InvalidBodyError)
      test.end()
    }

    FailAction({}, reply, 'payload', error)
  })

  failActionTest.test('reply with InvalidUriParameterError if source is params and error data is ValidationError', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.ok(err instanceof ValidationErrors.InvalidUriParameterError)
      test.end()
    }

    FailAction({}, reply, 'params', error)
  })

  failActionTest.test('reply with InvalidQueryParameterError if source is query and error data is ValidationError', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.ok(err instanceof ValidationErrors.InvalidQueryParameterError)
      test.end()
    }

    FailAction({}, reply, 'query', error)
  })

  failActionTest.test('reply with InvalidHeaderError if source is headers and error data is ValidationError', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.ok(err instanceof ValidationErrors.InvalidHeaderError)
      test.end()
    }

    FailAction({}, reply, 'headers', error)
  })

  failActionTest.test('reply with Error if source is unknown and error data is ValidationError', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.equal(err, error)
      test.end()
    }

    FailAction({}, reply, 'unknown', error)
  })

  failActionTest.test('map error data details to validation errors', test => {
    const validationError = new Error()
    validationError.name = 'ValidationError'
    validationError.details = [
      { message: 'message 1', context: 'context 1' },
      { message: 'message 2', context: 'context 2' }
    ]
    const error = {
      data: validationError
    }

    const reply = (err) => {
      test.ok(err instanceof ValidationErrors.InvalidBodyError)
      test.deepEqual(err.payload.validationErrors, validationError.details.map(d => ({
        message: d.message,
        params: d.context
      })))
      test.end()
    }

    FailAction({}, reply, 'payload', error)
  })

  failActionTest.end()
})
