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

import { describe, test, expect } from '@jest/globals'
import safeStringify from 'fast-safe-stringify'

import {
  MojaloopApiErrorCodes,
  MojaloopApiErrorCodeFromCode,
  MojaloopApiErrorObjectFromCode,
  MojaloopFSPIOPError
} from '../src/errors'

describe('Mojaloop errors', () => {
  test('all error constants have a code and a message', () => {
    const allOk = Object.keys(MojaloopApiErrorCodes).every(k => {
      return (
        MojaloopApiErrorCodes[k].code.length > 0 &&
        MojaloopApiErrorCodes[k].message.length > 0
      )
    })
    expect(allOk).toBe(true)
  })

  test('returns a mojaloop error code object given a valid mojaloop error code', () => {
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    expect(ec).not.toBeUndefined()
    expect(ec?.code).not.toBeUndefined()
    expect(ec?.code).toBe(c)
    expect(ec?.message).not.toBeUndefined()
  })

  test('returns a mojaloop API error object given a valid mojaloop error code', () => {
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)

    const mec = MojaloopApiErrorObjectFromCode(ec!)

    expect(mec).not.toBeUndefined()
    expect(mec?.errorInformation).not.toBeUndefined()
    expect(mec?.errorInformation.errorCode).toBe(c)
    expect(mec?.errorInformation.errorDescription).not.toBeUndefined()
  })

  test('returns undefined given an invalid mojaloop error code', () => {
    const c = 'abcd'
    const ec = MojaloopApiErrorCodeFromCode(c)

    expect(ec).toBeUndefined()
  })

  test('constructs a MojaloopFSPIOPError object correctly', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!
    const cause = new Error('test cause')

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    expect(me.name).toBe('FSPIOPError')
    expect(me.cause).toBe(cause)
    expect(me.replyTo).toBe(replyToFsp)
    expect(me.apiErrorCode).toBe(ec)
    expect(me.httpStatusCode).toBe(ec.httpStatusCode)

    const apiError = me.toApiErrorObject()
    expect(apiError).not.toBeUndefined()
    expect(apiError.errorInformation).not.toBeUndefined()
    expect(apiError.errorInformation.errorCode).toBe(ec.code)
    expect(apiError.errorInformation.errorDescription).toBe(ec.message)

    const errorString = me.toString()
    expect(errorString).not.toBeUndefined()
    expect(errorString.length).toBeGreaterThan(0)

    const fullErrorObject = me.toFullErrorObject() as { message: string, replyTo: string, apiErrorCode: typeof ec, extensions: object, cause: string | undefined }
    expect(fullErrorObject).not.toBeUndefined()
    expect(fullErrorObject.message).toBe(msg)
    expect(fullErrorObject.replyTo).toBe(replyToFsp)
    expect(fullErrorObject.apiErrorCode).toBe(ec)
    expect(fullErrorObject.extensions).toEqual({})
    expect(fullErrorObject.cause).toBe(cause.stack)
  })

  test('toFullErrorObject includes cause stack if cause is an error object', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!
    const cause = new Error('test cause')

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    expect(fullErrorObject).not.toBeUndefined()
    expect((fullErrorObject as { cause?: string }).cause).toBe(cause.stack)
  })

  test('toFullErrorObject includes cause as string if cause is not an error object', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!
    const cause = { some: 'object' }

    const me = new MojaloopFSPIOPError(cause, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    expect(fullErrorObject).not.toBeUndefined()
    expect((fullErrorObject as { cause?: string }).cause).toBe(safeStringify(cause))
  })

  test('toFullErrorObject includes undefined cause if cause is not provided', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!

    const me = new MojaloopFSPIOPError(undefined, msg, replyToFsp, ec, {})

    const fullErrorObject = me.toFullErrorObject()
    expect(fullErrorObject).not.toBeUndefined()
    expect((fullErrorObject as { cause?: string }).cause).toBeUndefined()
  })

  test('toApiErrorObject includes extensions if provided', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!
    const extensions = { key: 'value' }

    const me = new MojaloopFSPIOPError(new Error('test cause'), msg, replyToFsp, ec, extensions)

    const apiErrorObject = me.toApiErrorObject()
    expect(apiErrorObject).not.toBeUndefined()
    expect(apiErrorObject.errorInformation).not.toBeUndefined()
    expect(apiErrorObject.errorInformation.errorCode).toBe(ec.code)
    expect(apiErrorObject.errorInformation.errorDescription).toBe(ec.message)
    expect(apiErrorObject.errorInformation.extensionList).toEqual(extensions)
  })

  test('toApiErrorObject does not include extensions if not provided', () => {
    const replyToFsp = 'replyfsp'
    const msg = 'test message'
    const c = '5200'
    const ec = MojaloopApiErrorCodeFromCode(c)!

    const me = new MojaloopFSPIOPError(new Error('test cause'), msg, replyToFsp, ec, undefined)

    const apiErrorObject = me.toApiErrorObject()
    expect(apiErrorObject).not.toBeUndefined()
    expect(apiErrorObject.errorInformation).not.toBeUndefined()
    expect(apiErrorObject.errorInformation.errorCode).toBe(ec.code)
    expect(apiErrorObject.errorInformation.errorDescription).toBe(ec.message)
    expect(apiErrorObject.errorInformation.extensionList).toBeUndefined()
  })
})
