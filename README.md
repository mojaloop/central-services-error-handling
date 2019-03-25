# central-services-error-handling
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-error-handling.svg?style=flat)](https://github.com/mojaloop/central-services-error-handling/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-error-handling.svg?style=flat)](https://github.com/mojaloop/central-services-error-handling/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-error-handling.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-error-handling)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-error-handling.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-error-handling)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-error-handling.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-error-handling)

Hapi error handling module

### Setup

#### nvm 

######(This is optional, you can install node directly from the website, node version manager(nvm) isn't really needed unless you want to use multiple versions of node)

If you are on **Ubuntu** refer to [nvm github page](https://github.com/creationix/nvm) for installation

If you are **MacOS** download the nvm install via Homebrew:

```
brew update
brew install nvm
mkdir ~/.nvm
vi ~/.bash_profile
```

* Ensure that nvm was installed correctly with `nvm --version`, which should return the version of nvm installed
* Install the version (at time of publish 10.15.3 current LTS) of Node.js you want:
  * Install the latest LTS version with `nvm install --lts`
  * Use the latest LTS verison with `nvm use --lts`
  * Install the latest version with `nvm install node`
  * Use the latest version with `nvm use node`
  * If necessary, fallback to `nvm install 10.15.3`

##### Setup nvm
Create a *.bash_profile* file with `touch ~/.bash_profile`, then `nano ~/.bash_profile` and *write*:
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
```

#### npm
By installing *node* during *nvm* installation above, you should have the corresponding npm version installed

##### Setup npm
* The _.npmrc_ file in your user root just needs to be present as the repository it will use is 
http://npmjs.org If it doesn't exist just create it.

* Then **cd** into the central_services_stream project and run the following command:
```
npm install
```

## Tests

Running the tests:

    npm run test
    npm run test:unit
    npm run test:xunit
    npm run test:coverage
    npm run test:coverage-check

Tests include code coverage via istanbul. See the test/unit/ folder for testing scripts.