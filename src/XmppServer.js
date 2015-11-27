'use strict';

var  xmpp = require('node-xmpp-server')
    , debug = require('debug')('mero:XmppServer')
    , util = require('util')
    , EventEmitter = require('events').EventEmitter
    ;


class XmppServer extends EventEmitter{
    constructor() {
        super();
        this.xmppServer = new xmpp.Router(5269, '::');
        this.xmppServer.register('sipgoat.de', (stanza) => this.handleStanza(stanza));
    }

    handleStanza(stanza) {
        switch (stanza.getName()) {
            case 'presence':
                let res = "<presence from='foobar@sipgoat.de' to='skaverat@skaverat.net' type='subscribed'/>";
                let req = "<presence to='foobar@sipgoat.de' from='skaverat@skaverat.net' type='subscribe'/>";
                this.xmppServer.send(ltx.parse(res));
                this.xmppServer.send(ltx.parse(req));
                break;

            case 'message':
                stanza.children.forEach((element) => {
                    if(element.is('body')) {
                        this.emit('xmpp.message', stanza.attrs['from'], stanza.attrs['to'], element.getText().trim());
                    }
                });
                //debug(util.format("Received message: %s", messageBody.trim()));
                break;
        }
    }


}

module.exports = XmppServer;