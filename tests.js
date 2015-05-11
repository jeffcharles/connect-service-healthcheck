var _ = require('lodash'),
  BPromise = require('bluebird'),
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
    return request(createApp()).get('/healthcheck').expect(200);
  });
});

describe('detailed healthcheck', function() {
  it('should work with no component healthchecks', function() {
    function healthchecks() {
      return {};
    }
    return request(createApp({componentHealthchecks: healthchecks}))
      .get('/healthcheck/detailed')
      .expect(200)
      .expect({});
  });

  it('should return 200 with two passing healthchecks', function() {
    function healthchecks() {
      return {foo: BPromise.resolve('good'), bar: BPromise.resolve('great')};
    }
    return request(createApp({componentHealthchecks: healthchecks}))
      .get('/healthcheck/detailed')
      .expect(200)
      .expect({foo: 'good', bar: 'great'});
  });

  it('should return 500 with one passing and one failing healthcheck', function() {
    function healthchecks() {
      return {
        foo: BPromise.reject(new Error('bad')),
        bar: BPromise.resolve('great')
      };
    }
    return request(createApp({componentHealthchecks: healthchecks}))
      .get('/healthcheck/detailed')
      .expect(500)
      .expect({foo: {name: 'Error', message: 'bad'}, bar: 'great'});
  });

  it('should return 500 with two failing healthchecks', function() {
    function healthchecks() {
      return {
        foo: BPromise.reject(new Error('bad')),
        bar: BPromise.reject(new Error('worse'))
      };
    }
    return request(createApp({componentHealthchecks: healthchecks}))
      .get('/healthcheck/detailed')
      .expect(500)
      .expect({
        foo: {name: 'Error', message: 'bad'},
        bar: {name: 'Error', message: 'worse'}
      });
  });

  it('should not fail if thing thrown is not an error', function() {
    function healthchecks() {
      return {foo: BPromise.reject('bad')};
    }
    return request(createApp({componentHealthchecks: healthchecks}))
      .get('/healthcheck/detailed')
      .expect(500)
      .expect({foo: 'bad'});
  });
});

describe('memory dump', function() {
  it('should return 401 given missing creds', function() {
    return request(createApp()).get('/healthcheck/memory').expect(401);
  });

  it('should return 401 given invalid creds', function() {
    return request(createApp()).get('/healthcheck/memory')
      .set('Authorization', 'Basic 12ab')
      .expect(401);
  });

  it('should return 200 with file given valid creds', function() {
    return request(createApp()).get('/healthcheck/memory')
      .set('Authorization', 'Basic Zm9vOmZvbw==')
      .expect(200);
  });
});

describe('version', function() {
  it('should return 404 if missing version', function() {
    return request(createApp()).get('/healthcheck/version').expect(404);
  });

  it('should return 200 with the version if provided', function() {
    return request(createApp({version: {hash: '1234'}}))
      .get('/healthcheck/version')
      .expect(200)
      .expect('{"hash":"1234"}');
  });
});
