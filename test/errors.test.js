/*************************************************************************
 *  (C) Copyright Mojaloop Foundation. 2024 - All rights reserved.        *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - jbush@mojaloop.io                                   *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - jbush@mojaloop.io                                   *
 *************************************************************************/

const Test = require('tape')
const safeStringify = require('fast-safe-stringify')

const {
  MojaloopApiErrorCodes,
  MojaloopApiErrorCodeFromCode,
  MojaloopApiErrorObjectFromCode,
  MojaloopFSPIOPError
} = require('../src/errors')

Test('Mojaloop errors', (t) => {
  t.test('all error constants have a code and a message', (assert) => {
    const allOk = Object.keys(MojaloopApiErrorCodes).every(k => {
      return (MojaloopApiErrorCodes[k].code.length > 0 && MojaloopApiErrorCodes[k].message.length > 0)
    })

    assert.equal(allOk, true)
    assert.end()
  })

  t.test('returns a mojaloop error code object given a valid mojaloop error code', (assert) => {
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    assert.notEqual(ec, undefined)
    assert.notEqual(ec.code, undefined)
    assert.equal(ec.code, c)
    assert.notEqual(ec.message, undefined)
    assert.end()
  })

  t.test('returns a mojaloop API error object given a valid mojaloop error code', (assert) => {
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    const mec = MojaloopApiErrorObjectFromCode(ec)

    assert.notEqual(mec, undefined)
    assert.notEqual(mec.errorInformation, undefined)
    assert.equal(mec.errorInformation.errorCode, c)
    assert.notEqual(mec.errorInformation.errorDescription, undefined)
    assert.end()
  })

  t.test('returns undefined given an invalid mojaloop error code', (assert) => {
    const c = 'abcd'
    const ec = MojaloopApiErrorCodeFromCode(c)

    assert.equal(ec, undefined)
    assert.end()
  })

  t.test('constructs a MojaloopFSPIOPError object correctly', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)
    const cause = new Error('test cause')

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    assert.equal(me.name, 'FSPIOPError')
    assert.equal(me.cause, cause)
    assert.equal(me.replyTo, replyToFsp)
    assert.equal(me.apiErrorCode, ec)
    assert.equal(me.httpStatusCode, ec.httpStatusCode)

    const apiError = me.toApiErrorObject()
    assert.notEqual(apiError, undefined)
    assert.notEqual(apiError.errorInformation, undefined)
    assert.equal(apiError.errorInformation.errorCode, ec.code)
    assert.equal(apiError.errorInformation.errorDescription, ec.message)

    const errorString = me.toString()
    assert.notEqual(errorString, undefined)
    assert.ok(errorString.length > 0)

    const fullErrorObject = me.toFullErrorObject()
    assert.notEqual(fullErrorObject, undefined)
    assert.equal(fullErrorObject.message, msg)
    assert.equal(fullErrorObject.replyTo, replyToFsp)
    assert.equal(fullErrorObject.apiErrorCode, ec)
    assert.deepEqual(fullErrorObject.extensions, {})
    assert.equal(fullErrorObject.cause, cause.stack)
    assert.end()
  })

  t.test('toFullErrorObject includes cause stack if cause is an error object', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)
    const cause = new Error('test cause')

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    assert.notEqual(fullErrorObject, undefined)
    assert.equal(fullErrorObject.cause, cause.stack)
    assert.end()
  })

  t.test('toFullErrorObject includes cause as string if cause is not an error object', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)
    const cause = { some: 'object' }

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    assert.notEqual(fullErrorObject, undefined)
    assert.equal(fullErrorObject.cause, safeStringify(cause))
    assert.end()
  })

  t.test('toFullErrorObject includes undefined cause if cause is not provided', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    const me = new MojaloopFSPIOPError(undefined, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    assert.notEqual(fullErrorObject, undefined)
    assert.equal(fullErrorObject.cause, undefined)
    assert.end()
  })

  t.test('toApiErrorObject includes extensions if provided', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)
    const extensions = { key: 'value' }

    const me = new MojaloopFSPIOPError(new Error('test cause'), msg, replyToFsp, ec, extensions)

    const apiErrorObject = me.toApiErrorObject()
    assert.notEqual(apiErrorObject, undefined)
    assert.notEqual(apiErrorObject.errorInformation, undefined)
    assert.equal(apiErrorObject.errorInformation.errorCode, ec.code)
    assert.equal(apiErrorObject.errorInformation.errorDescription, ec.message)
    assert.deepEqual(apiErrorObject.errorInformation.extensionList, extensions)
    assert.end()
  })

  t.test('toApiErrorObject does not include extensions if not provided', (assert) => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    const me = new MojaloopFSPIOPError(new Error('test cause'), msg, replyToFsp, ec, undefined)

    const apiErrorObject = me.toApiErrorObject()
    assert.notEqual(apiErrorObject, undefined)
    assert.notEqual(apiErrorObject.errorInformation, undefined)
    assert.equal(apiErrorObject.errorInformation.errorCode, ec.code)
    assert.equal(apiErrorObject.errorInformation.errorDescription, ec.message)
    assert.equal(apiErrorObject.errorInformation.extensionList, undefined)
    assert.end()
  })
})
