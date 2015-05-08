# connect-service-healthcheck

Adds healthcheck routes to your service.

- `/` - checks if your web server is serving traffic
- `/detailed` - checks if the web server can hit its dependencies
- `/memory` - performs a memory dump
- `/version` - returns the current version of the service

## How to use

    var express = require('express'),
      healthcheck = require('connect-service-healthcheck'),
      version = require('./version');

    var app = express();
    app.use(
      '/healthcheck',
      healthcheck({
        detailedHealthcheck: function(req, res) {
          res.sendStatus(204);
        },
        memoryName: 'name',
        memoryPass: 'pass',
        version: version
      })
    );

## Configuration

The middleware expects an options object with four members:

- `detailedHealthcheck` (optional) - connect middleware to render a detailed healthcheck
- `memoryName` (mandatory) - a username necessary for performing a memory dump
- `memoryPass` (mandatory) - a password necessary for performing a memory dump
- `version` (optional) - an object containing version information
