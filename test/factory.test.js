'use strict'

const Test = require('tape')
const Factory = require('../src/factory')
const Errors = require('../src/enums').FSPIOPErrorCodes

Test('Factory should', factoryTest => {
  factoryTest.test('create an FSPIOPError', function (test) {
    const fspiopError = Factory.createFSPIOPError({ stack: 'Error:...' }, 'An error has occurred', 'dfsp1', Errors.SERVER_ERROR, [
      { key: 'testKey', value: 'testValue' }
    ])

    test.ok(fspiopError)
    test.end()
  })
  factoryTest.end()
})
