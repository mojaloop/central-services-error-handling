/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 - Neal Donnan <neal.donnan@modusbox.com>
 - Juan Correa <juan.correa@modusbox.com>
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

import * as Handler from './handler'
import * as Factory from './factory'
import * as Enums from './enums'
import { Server } from '@hapi/hapi'

export const plugin = {
  name: 'error-handler',
  register: function (server: Server) {
    server.ext('onPreResponse', Handler.onPreResponse)
  }
}

export interface ValidateRoutesOptions {
  abortEarly?: boolean
  language?: {
    key?: string
    [key: string]: any
  }
  [key: string]: any
}

export const validateRoutes = (options: ValidateRoutesOptions = {}): ValidateRoutesOptions => {
  options.abortEarly = false
  const language = options.language || {}
  language.key = '{{!key}} '
  options.language = language
  return options
}

export {
  Handler,
  Factory,
  Enums
}

export const CreateFSPIOPError = Factory.createFSPIOPError
export const CreateFSPIOPErrorFromJoiError = Factory.createFSPIOPErrorFromJoiError
export const CreateInternalServerFSPIOPError = Factory.createInternalServerFSPIOPError
export const CreateFSPIOPErrorFromErrorInformation = Factory.createFSPIOPErrorFromErrorInformation
export const CreateFSPIOPErrorFromErrorCode = Factory.createFSPIOPErrorFromErrorCode
export const ReformatFSPIOPError = Factory.reformatFSPIOPError
export const ValidateFSPIOPErrorCode = Factory.validateFSPIOPErrorCode
export const FindFSPIOPErrorCode = Enums.findFSPIOPErrorCode
export const ValidateFSPIOPErrorGroups = Factory.validateFSPIOPErrorGroups
