var _ = require('lodash'),
  basicAuth = require('basic-auth'),
  BPromise = require('bluebird'),
  Errio = require('errio'),
  express = require('express');

/**
 * Creates a healthcheck router
 *
 * @param {Object} opts - Options
 * @param {function} opts.componentHealthchecks - Healthchecks to perform on dependent components (object with identifiers mapping to promises)
 * @param {string} opts.memoryName - The username for fetching memory
 * @param {string} opts.memoryPass - The password for fetching memory
 * @param {Object} [opts.version] - Version information
 * @returns {Object} - Express router
 */
module.exports = function createHealthcheckRouter(opts) {
  if (!opts.memoryName || !opts.memoryPass) {
    throw new Error('Need to specify `memoryName` and `memoryPass`');
  }

  var router = express.Router();

  router.get('/', function(req, res) {
    res.sendStatus(200);
  });

  router.get('/detailed', function(req, res, next) {
    var anyErrors = false;
    var nonfailingChecks =
      _.mapValues(opts.componentHealthchecks(), function(promise) {
        return promise.then(null, function(err) {
          anyErrors = true;
          var isLikelyErrorType = err.name && err.message;
          return isLikelyErrorType ? Errio.toObject(err) : err;
        });
      });
    BPromise.props(nonfailingChecks).then(function(results) {
      res.status(anyErrors ? 500 : 200).json(results);
    }).then(null, function(err) {
      next(err);
    });
  });

  router.get('/memory', function(req, res, next) {
    var credentials = basicAuth(req);
    var authed = credentials && credentials.name === opts.memoryName &&
      credentials.pass === opts.memoryPass;
    if (!authed) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="memory"'
      });
      res.end();
      return;
    }

    var tmpPath =
      process.platform === 'win32' ? process.env.TEMP + '\\' : '/tmp/';
    var dumpPath = tmpPath + Date.now() + '.heapsnapshot';
    // warning - this is synchronous, best to pull the server out of load before
    // calling this
    var heapdump = require('heapdump');

    heapdump.writeSnapshot(
      dumpPath,
      function(err, filename) {
        if (err) {
          next(err);
          return;
        }
        res.sendFile(filename, function(err) {
          if (err) {
            next(err);
            return;
          }
        });
      });
  });

  if (opts.version) {
    router.get('/version', function(req, res) {
      res.json(opts.version);
    });
  }

  return router;
};
