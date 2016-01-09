'use strict';

var xmpp = require('node-xmpp-server')
  , debug = require('debug')('mero:XmppServer')
  , _ = require('util')
  , ltx = require('node-xmpp-core').ltx
  , EventEmitter = require('events').EventEmitter
  ;


class XmppServer extends EventEmitter {
  constructor() {
    super();

    this.stanzas = {
      presence: "<presence from='%s' to='%s' type='%s'/>"
    }

    this.xmppServer = new xmpp.Router(5269, '0.0.0.0');
    this.xmppServer.register("sipgoat.de", (stanza) => this.handleStanza(stanza));
  }


  handleStanza(stanza) {
    switch (stanza.getName()) {
      case "presence":
        this.handlePresenceStanza(stanza);
        break;

      case "message":
        this.handleMessageStanza(stanza);
        break;
      default:
        debug("Unknown stanza:");
        debug(stanza.toString());
    }
  }

  handlePresenceStanza(stanza) {
    const from = stanza.attrs.from;
    const to = stanza.attrs.to;
    switch (stanza.attrs.type) {
      case "subscribe":
        this.emit('xmpp.presence.subscribe', from, to);
        break;
      case "probe":
        this.xmppServer.send(ltx.parse(_.format(this.stanzas.presence, to, from, '')));
        break;
      default:
        const status = stanza.getChild('show');
        if (stanza.attrs.type == 'unavailable') {
          this.emit('xmpp.presence.status', from, 'offline');
        } else if (status) {
          this.emit('xmpp.presence.status', from, status.getText());
        } else {
          this.emit('xmpp.presence.status', from, 'online');
        }
        break;
    }
  }

  handleMessageStanza(stanza) {
    stanza.children.forEach((element) => {
      if (element.is("body")) {
        this.emit('xmpp.message', stanza.attrs['from'], stanza.attrs['to'], element.getText().trim());
      } else {
        debug(element);
      }
    });
  }

  sendMessage(from, to, message) {
    let stanzaTemplate = "<message from='%s' to='%s' type='chat' id='%s'><body>%s</body></message>";


    let hrTime = process.hrtime();
    let stanza = _.format(stanzaTemplate, from, to, (hrTime[0] * 1000000 + hrTime[1]), message);
    debug(stanza);
    this.xmppServer.send(ltx.parse(stanza));
  }

  /**
   * @param from The requester
   * @param to the matrix user
   */
  acceptSubscription(from, to) {
    var resFormatted = _.format(this.stanzas.presence, to, from, "subscribed");
    var reqFormatted = _.format(this.stanzas.presence, to, from, "subscribe");
    this.xmppServer.send(ltx.parse(resFormatted));
    this.xmppServer.send(ltx.parse(reqFormatted));
  }

}

module.exports = XmppServer;