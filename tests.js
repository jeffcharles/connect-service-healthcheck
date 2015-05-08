var _ = require('lodash'),
  express = require('express'),
  request = require('supertest-as-promised'),
  healthcheck = require('./');

function createApp(opts) {
  var app = express();
  var options = _.assign({memoryName: 'foo', memoryPass: 'foo'}, opts);
  app.use('/healthcheck', healthcheck(options));
  return app;
}

describe('simple healthcheck', function() {
  it('should return 200', function() {
    request(createApp()).get('/healthcheck').expect(200);
  });
});

describe('detailed healthcheck', function() {
  it('should return 404 if not defined', function() {
    request(createApp()).get('/healthcheck/detailed').expect(404);
  });

  it('should return run the detailed healthcheck if defined', function() {
    function detailedHealthcheck(req, res) {
      res.json({msg: 'hello!'});
    }
    request(createApp({detailedHealthcheck: detailedHealthcheck}))
      .get('/healthcheck/detailed')
      .expect(200)
      .expect('{"msg": "hello!"}');
  });
});

describe('memory dump', function() {
  it('should return 401 given missing creds', function() {
    request(createApp()).get('/healthcheck/memory').expect(401);
  });

  it('should return 401 given invalid creds', function() {
    request(createApp()).get('/healthcheck/memory')
      .set('Authorization', 'Basic 12ab')
      .expect(401);
  });

  it('should return 200 with file given valid creds', function() {
    request(createApp()).get('/healthcheck/memory')
      .set('Authorization', 'Basic Zm9vOmZvbw==')
      .expect(200);
  });
});

describe('version', function() {
  it('should return 404 if missing version', function() {
    request(createApp()).get('/healthcheck/version').expect(404);
  });

  it('should return 200 with the version if provided', function() {
    request(createApp({version: {hash: '1234'}}))
      .get('/healthcheck/version')
      .expect(200)
      .expect('{"version": {"hash": "1234"}}');
  });
});
