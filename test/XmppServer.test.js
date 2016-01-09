'use strict';

var test = require('unit.js');
var ltx = require('node-xmpp-core').ltx;
var proxyquire = require('proxyquire');
var _ = require('util');


describe('Xmpp Server', function () {

  let XmppServer;
  beforeEach(function () {
    XmppServer = proxyquire('../src/XmppServer', {
      'node-xmpp-server': {}
    });
  });

  describe('#handleStanza', function () {
    it('does not emit event on unknown stanza', function () {
      var unknownStanza = ltx.parse('<unknown from="foobar@example.com" to="barbaz@example.com" />');
      var server = new XmppServer();

      var eventStub = test.stub(server, 'emit');
      server.handleStanza(unknownStanza);
      test.assert(!eventStub.called);
      eventStub.restore();
    });

    it('emit message event on message stanza', function () {
      const xmppFrom = 'foobar@example.com';
      const xmppTo = 'barbaz@example.com';
      const xmppMessage = 'foobar';

      var messageStanza = ltx.parse(_.format('<message from="%s" to="%s" type="chat" id="123456789"><body>%s</body></message>', xmppFrom, xmppTo, xmppMessage));
      var server = new XmppServer();

      var eventStub = test.stub(server, 'emit');
      server.handleStanza(messageStanza);
      test.assert(eventStub.calledWithExactly('xmpp.message', xmppFrom, xmppTo, xmppMessage));
      eventStub.restore();
    });

    it('trims incoming messages', function () {
      const xmppFrom = 'foobar@example.com';
      const xmppTo = 'barbaz@example.com';
      const xmppMessage = '     foobar with space      ';

      var messageStanza = ltx.parse(_.format('<message from="%s" to="%s" type="chat" id="123456789"><body>%s</body></message>', xmppFrom, xmppTo, xmppMessage));
      var server = new XmppServer();

      var eventStub = test.stub(server, 'emit');
      server.handleStanza(messageStanza);
      test.assert(eventStub.calledWithExactly('xmpp.message', xmppFrom, xmppTo, 'foobar with space'));
      eventStub.restore();
    });
  });
});
