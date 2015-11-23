'use strict'
var xmpp = require('node-xmpp-server')
var ltx = require('node-xmpp-core').ltx
var pem = require('pem')


var r = new xmpp.Router(5269, '::',
    {rejectUnauthorized: false, tls: true}
)

r.register('sipgoat.de', function (stanza) {
    console.log('GOT YA << ' + stanza.toString())
    if (stanza.attrs.type !== 'error') {
        var me = stanza.attrs.to
        stanza.attrs.to = stanza.attrs.from
        stanza.attrs.from = me
        r.send(stanza)
    }
});