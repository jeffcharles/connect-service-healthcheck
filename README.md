# connect-service-healthcheck

[![NPM](https://nodei.co/npm/connect-service-healthcheck.png)](https://nodei.co/npm/connect-service-healthcheck/)

[![Build Status](https://travis-ci.org/jeffcharles/connect-service-healthcheck.svg?branch=master)](https://travis-ci.org/jeffcharles/connect-service-healthcheck)

Adds healthcheck routes to your service.

- `/` - checks if your web server is serving traffic
- `/detailed` - checks if the web server can hit its dependencies
- `/memory` - performs a memory dump
- `/version` - returns the current version of the service

## How to use

```JavaScript
var express = require('express'),
  healthcheck = require('connect-service-healthcheck'),
  version = require('./version');

var app = express();
app.use(
  '/healthcheck',
  healthcheck({
    componentHealthchecks: function() {
      return {foo: BPromise.resolve('foo is good')};
    },
    memoryName: 'name',
    memoryPass: 'pass',
    version: version
  })
);
```

## Configuration

The middleware expects an options object with four members:

- `componentHealthchecks` (mandatory) - An object containing functions returning a promise that checks a dependent component
- `memoryName` (mandatory) - a username necessary for performing a memory dump
- `memoryPass` (mandatory) - a password necessary for performing a memory dump
- `version` (optional) - an object containing version information
