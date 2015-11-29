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
        this.xmppServer = new xmpp.Router(5269, '::');
        this.xmppServer.register('sipgoat.de', (stanza) => this.handleStanza(stanza));
    }

    handleStanza(stanza) {
        switch (stanza.getName()) {
            case 'presence':
                debug(stanza.toString());

                switch (stanza.attrs.type) {
                    case "subscribe":
                        this.emit('xmpp.presence.subscribe', stanza.attrs.from, stanza.attrs.to);
                        break;
                }

                break;

            case 'message':
                stanza.children.forEach((element) => {
                    if (element.is('body')) {
                        this.emit('xmpp.message', stanza.attrs['from'], stanza.attrs['to'], element.getText().trim());
                    } else {
                        debug(element);
                    }

                });
                //debug(util.format("Received message: %s", messageBody.trim()));
                break;
            default:
                debug("Unknown stanza:");
                debug(stanza.toString());
        }
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
        let res = "<presence from='%s' to='%s' type='subscribed'/>";
        let req = "<presence from='%s' to='%s' type='subscribe'/>";

        var resFormatted = _.format(res, to, from);
        var reqFormatted = _.format(req, to, from);
        this.xmppServer.send(ltx.parse(resFormatted));
        this.xmppServer.send(ltx.parse(reqFormatted));
    }

}

module.exports = XmppServer;