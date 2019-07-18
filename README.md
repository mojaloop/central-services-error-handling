# central-services-error-handling
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-error-handling.svg?style=flat)](https://github.com/mojaloop/central-services-error-handling/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-error-handling.svg?style=flat)](https://github.com/mojaloop/central-services-error-handling/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-error-handling.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-error-handling)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-error-handling.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-error-handling)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-error-handling.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-error-handling)

Hapi error handling module


## Auditing Dependencies

We use `npm-audit-resolver` along with `npm audit` to check dependencies for vulnerabilities, and keep track of resolved dependencies with an `audit-resolv.json` file.

To start a new resolution process, run:
```bash
npm run audit:resolve
```

You can then check to see if the CI will pass based on the current dependencies with:
```bash
npm run audit:check
```

And commit the changed `audit-resolv.json` to ensure that CircleCI will build correctly.

