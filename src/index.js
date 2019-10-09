/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * ModusBox
 - Neal Donnan <neal.donnan@modusbox.com>
 - Juan Correa <juan.correa@modusbox.com>
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 - Miguel de Barros <miguel.debarros@modusbox.com>

 --------------
 ******/

'use strict'

const Handler = require('./handler')
const Factory = require('./factory')
const Enums = require('./enums')

const plugin = {
  name: 'error-handler',
  register: function (server) {
    server.ext('onPreResponse', Handler.onPreResponse)
  }
}

const validateRoutes = (options = {}) => {
  options.abortEarly = false
  const language = options.language || {}
  language.key = '{{!key}} '
  options.language = language
  return options
}

module.exports = {
  plugin,
  Handler: Handler,
  validateRoutes,
  Factory: Factory,
  Enums: Enums,
  CreateFSPIOPError: Factory.createFSPIOPError,
  CreateFSPIOPErrorFromJoiError: Factory.createFSPIOPErrorFromJoiError,
  CreateInternalServerFSPIOPError: Factory.createInternalServerFSPIOPError,
  CreateFSPIOPErrorFromErrorInformation: Factory.createFSPIOPErrorFromErrorInformation,
  CreateFSPIOPErrorFromErrorCode: Factory.createFSPIOPErrorFromErrorCode,
  ReformatFSPIOPError: Factory.reformatFSPIOPError,
  ValidateFSPIOPErrorCode: Factory.validateFSPIOPErrorCode,
  FindFSPIOPErrorCode: Enums.findFSPIOPErrorCode
}
