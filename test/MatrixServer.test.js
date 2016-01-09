'use strict';

var test = require('unit.js');
var proxyquire = require('proxyquire');


describe('Matrix Server', function () {

  let MatrixServer, mockConfig;
  beforeEach(function () {
    mockConfig = {
      "mx": {
        "app_port": 42,
        "access_token": 'myToken',
        "host": 'example.com',
        "port": 23
      }
    };

    MatrixServer = proxyquire('../src/MatrixServer', {
      'restify': {},
      '../config.json': mockConfig
    });
  });

  describe('#_getMatrixConnection', function () {
    it('loads baseUrl from config', function () {
      mockConfig.mx.host = 'foo.com';
      mockConfig.mx.port = 423;

      var result = MatrixServer._getMatrixConnection('foo@example.com');

      test.assert.equal(result.baseUrl, 'https://foo.com:423');
    });

    it('generates a correct virtual user id for given JID', function() {
      const jid = 'foo@example.com';
      var result = MatrixServer._getMatrixConnection(jid);

      test.assert.equal(result.credentials.userId, '@mero_' + jid + ':example.com');
    });
  });
});
