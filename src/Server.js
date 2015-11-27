'use strict';
var ltx = require('node-xmpp-core').ltx
    , debug = require('debug')('mero:Server')
    , _ = require('util')
    , Datastore = require('nedb')
    ;

var MatrixServer = require('./MatrixServer')
    , XmppServer = require('./XmppServer')
    ;

class Server {
    constructor() {
        this.matrixServer = new MatrixServer();
        this.xmppServer = new XmppServer();
        this.database = new Datastore({filename: 'mero.db', autoload: true});
        this.xmppServer.on('xmpp.message', this.handleXmppMessage.bind(this));
    }

    handleXmppMessage(from, to, message) {
        //this.matrixServer.createRoom()
        //.then((foo) => {
        //    debug(foo);
        //})
        //.catch((foo) => {
        //    debug(foo);
        //});

        from = from.split('/')[0];
        to = to.split('/')[0];
        this.database.find({xmpp_external: from, xmpp_internal: to}, (err, data) => {
            if (err) {
                debug(err);
            } else {
                if(data.length > 0) {
                    let roomData = data[0];
                    this.matrixServer.sendMessage(from, roomData.matrix, message);
                }
                //TODO else create room
            }
        });

        //this.database.insert({
        //    xmpp: 'skaverat@skaverat.net',
        //    matrix: '!qCRbUNzZsSSbmirWNJ:m.skaverat.net'
        //}, function (err, done) {
        //    debug(err);
        //    debug(done);
        //});
        //var roomData = {
        //    xmpp: 'skaverat@skaverat.net',
        //    matrix: '!qCRbUNzZsSSbmirWNJ:m.skaverat.net'
        //};
        //this.matrixServer.sendMessage(from, roomData.matrix, message);
        //debug(_.format("From: %s", from));
        //debug(_.format("To: %s", to));
        //debug(_.format("Message: %s", message));
    }

}

module.exports = Server;