'use strict';
var ltx = require('node-xmpp-core').ltx
    , debug = require('debug')('mero:Server')
    , _ = require('util')
    , Datastore = require('nedb')
    , Q = require('q')
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
        from = from.split('/')[0]; //todo use xmpp core JID class?
        to = to.split('/')[0];

        this._findRoomData(from, to)
            .then((data) => {
                if(data.length > 0) {
                    let roomData = data[0];
                    this.matrixServer.sendMessage(roomData.xmpp_external, roomData.matrix, message);
                }else{
                    this.matrixServer.createRoom(to)
                    .then((result) => {
                        this.database.insert({
                            xmpp_external: from,
                            xmpp_internal: to,
                            matrix: result.room_id
                        }); //TODO error handling insert
                        this.matrixServer.sendMessage(from, result.room_id, message);
                    })
                    .catch((err) => {
                        debug(err);
                    });
                }
            })
            .catch((err) => {
                debug(err);
            });
    }

    _findRoomData(from, to) {
        let deferred = Q.defer();

        this.database.find({xmpp_external: from, xmpp_internal: to}, (err, data) => {
            if (err) {
                deferred.reject(new Error(err))
            } else {
                deferred.resolve(data);
            }
        });

        return deferred.promise;
    }

}

module.exports = Server;