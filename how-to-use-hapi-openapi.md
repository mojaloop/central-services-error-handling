# Create API from swagger file using hapi-openapi plugin

## Create the API framework from a description file

1. To be sure the file will pass without errors, load it into the [swagger editor](http://editor.swagger.io)
2. When no errors are found from the editor export the file as JSON
3. Install global building tools (Note : If premission errors are thrown during the installation
     , do not try an re-install with 'sudo'. 
     Use the following options : https://docs.npmjs.com/getting-started/fixing-npm-permissions)
      ```
      $ npm install -g yo
      $ npm install -g generator-swaggerize
      ```
4. Create the directory for the project and go there
5. run the generator
      ```
      $ yo swaggerize
      ```
6. Follow prompts. Make sure the path is correct and you choose HAPI.

The `server.js` file should look like that:
```
'use strict';

const Hapi = require('hapi');
const HapiOpenAPI = require('hapi-openapi');
const Path = require('path');

const init = async function() {

    const server = new Hapi.Server();

    await server.register({
        plugin: HapiOpenAPI,
        options: {
            api: Path.resolve('./central_ledger.json'),
            handlers: Path.resolve('./cl-openapi/handlers')
        }
    });

    await server.start();

    return server;
};

init().then(async (server) => {
    server.plugins.openapi.setHost(server.info.host + ':' + server.info.port);

    server.log(['info'], `Server running on ${server.info.host}:${server.info.port}`);
});
```

## Connect the mojaloop database to the newly created API service

1. Install the central-services-database package 
    ```
    $ npm install --save @mojaloop/central-services-database
    ```
2. Into the project directory, go to the `data` directory and create `index.js` that exports the Db object of the central-services-datgabase module
    ```
    module.exports = require('@mojaloop/central-services-database').Db
    ```
3. Import it into the `server.js` and create the connection function
    ```
    const Db = require('./data/index.js')

    async function connectDatabase () {
      return await Db.connect(`<db connection string>`)
    }
    ```
4. Execute the connection function after the initialization is fulfiled.
    ```
    init().then(async (server) => {
      await connectDatabase()
      server.plugins.openapi.setHost(server.info.host + ':' + server.info.port);

      server.log(['info'], `Server running on ${server.info.host}:${server.info.port}`);
    });
    ```
The `server.js` file should look something like that now.     
```
'use strict';

const Hapi = require('hapi');
const HapiOpenAPI = require('hapi-openapi');
const Path = require('path');
const Db = require('./data/index.js')

async function connectDatabase () {
    return await Db.connect(`mysql://central_ledger:password@localhost:3306/central_ledger`)
}

const init = async function() {

    const server = new Hapi.Server({port: 3005});

    await server.register({
        plugin: HapiOpenAPI,
        options: {
            api: Path.resolve('./central_ledger.json'),
            handlers: Path.resolve('./cl-openapi/handlers')
        }
    });

    await server.start();

    return server;
};

init().then(async (server) => {
    await connectDatabase()
    server.plugins.openapi.setHost(server.info.host + ':' + server.info.port);

    server.log(['info'], `Server running on ${server.info.host}:${server.info.port}`);
});
```

## Edit the data access models and handlers

Next step is to edit the data access models and handlers of the application.
Both data access layer and handlers have directory structure of the routes described into the API deffinition.
For example, to make `GET /participants` list all participants in the database following changes have to be done.

### Edit the data access model

1. Import the database into the data access module for participants: `data/participants.js`
    ```
    const Db = require('@mojaloop/central-services-database').Db
    ```

2. Check the get method. It should look something like that:
    ```
    get: {
        default: function (req, res, callback) {
            /**
            * Using mock data generator module.
            * Replace this by actual data for the api.
            */
            Mockgen().responses({
                    path: '/participants',
                    operation: 'get',
                    response: 'default'
            }, callback);
        }
    }
    ```
    Edit the mocked response with actual DB query.

    ```
    get: {
        default: async function () {
            try {
                const participants = await Db.participant.find({}, { order: 'name asc' })
                return participants
            } catch (err) {
                throw new Error(err.message)
            }
        }
    }
    ```
### Edit the handler to use the new database access method

1. Import the data access module for the participant `handlers/participants.js`
    ```
    const participantsData = require('../data/participants')
    ```
2. Check the get handler. It should look something like this:
    ```
    get: function getParticipants(request, h) {
        return Boom.notImplemented();
    }
    ```
    Edit the method placeholder to access the requested data:
    
    ```
    get: async function getParticipants (request, h) {
        try {
            return await participantsData.get.default()
        } catch (e) {
            return Boom.boomify(e)
        }
    }
    ```
## Adding authorization to the API

To protect some of the routes authorization might be added.

### Edit the API deffinition and create the verification logic
1. Edit the API deffinition file: 
    YAML example:

    ```
    securityDefinitions:
    api_key:
        type: apiKey
        name: Authorization
        in: header
    paths:
    '/users/':
        get:
        security:
            - api_key: []
    ```
2. Run the generator again. If you have previously generated files the generator will ask what it should do with any of them. Make sure the `/security` directory is added to the application. 

### Register and configure the authorization plugin [hapi-now-auth, for example](https://github.com/now-ims/hapi-now-auth)

1. Install the selected plugin into the project. `npm install @now-ims/hapi-now-auth`
2. Import the plugin
    ```
    const HapiNowAuth = require('@now-ims/hapi-now-auth');
    ```
3. Register the plugin into the init function and add the auth strategy that was defined into the API deffinition file.
    ```
    const init = async function(config = {port: 8080}) {
        const server = new Hapi.Server(config);

        await server.register({ plugin: HapiNowAuth });

        server.auth.strategy('api_key', 'hapi-now-auth', {
            verifyJWT: true,
            keychain: ['secret'],
            validate: require('./security/api_key')
        });
        await server.register({
            plugin: HapiOpenAPI,
            options: {
                api: Path.resolve('./config/swagger.json'),
                handlers: Path.resolve('./handlers')
            }
        });

        await server.start();

        return server;
    };
    ```
4. Edit the `/security/api_key.js` file to validate the key. 
    Mocked example:
    ```
    'use strict';

    // current working token eyJhbGciOiJIUzI1NiIsInR5cGUiOiJKV1QifQ.eyJrZXkiOiJsZXQtbWUtaW4ifQ.x8UTyfxxSc498Lbo1pP7zW5BxgPVU_ake2lTlYaRhDc

    module.exports = async (req, token, h) => {
        let isValid = false
        let artifacts = {}
        const credentials = token.decodedJWT;
        if (credentials.key === 'let-me-in') {
            isValid = true
            artifacts.info = 'yay'
        } else {
            artifacts.error = 'not authorized'
        }
        return { isValid, credentials, artifacts }
    }
    ```

## Testing framework

The generator adds tests as well. They are organized in the same manner as the data and handlers.
The tests are for the API only. Tape is used.
What is neccesary to be done, is to import the init function from our server module, to be imported with the same plugins and move the tests in the .then() part of the init promise: 

change this: 
```
            const server = new Hapi.Server();

            await server.register({
                plugin: HapiOpenAPI,
                options: {
                    api: Path.resolve(__dirname, '../../config/swagger.json'),
                    handlers: Path.join(__dirname, '../../handlers'),
                    outputvalidation: true
                }
            });
            <all tests are here>
```
into something like that:
```
            await InitServer({
            port: 3080
        }, testAPIOptions).then(async (server) => {
            server.plugins.openapi.setHost(server.info.host + ':' + server.info.port);
            <all tests are here>
        })
```