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

        this.matrixServer.on('matrix.room.join', this.handleMatrixRoomJoin.bind(this));
        this.matrixServer.on('matrix.room.message', this.handleMatrixRoomMessage.bind(this));

        this.xmppServer.on('xmpp.message', this.handleXmppMessage.bind(this));
        this.xmppServer.on('xmpp.presence.subscribe', this.handleXmppPresenceSubscribe.bind(this));
        this.xmppServer.on('xmpp.presence.status', this.handleXmppPresenceStatus.bind(this));
    }

    handleMatrixRoomMessage(from, room_id, message) {
        if(!from.startsWith('@mero_')) {
            this._findRoomDataByRoomId(room_id)
                .then((data) => {
                    data = data[0];
                    this.xmppServer.sendMessage(data.xmpp_internal, data.xmpp_external, message);
                });
        }
    }

    handleMatrixRoomJoin(room_id) {
        debug("Handling Room join!");
        this._findRoomDataByRoomId(room_id)
            .then((data) => {
                if (data.length > 0) {
                    let roomData = data[0];
                    this.xmppServer.acceptSubscription(roomData.xmpp_external, roomData.xmpp_internal);
                } else {
                    debug("Room join event without corresponding room data!")
                }
            });
    }

    handleXmppPresenceStatus(from, status) {
        debug("status from %s: %s", from, status);
        this.matrixServer.setPresence(from, status);
        //this.matrixServer.setUsername(from, status);
    }

    handleXmppPresenceSubscribe(from, to) {
        debug("Incoming sub request: %s -> %s", from, to);

        this._findRoomData(from, to)
            .then((data) => {
                //we maybealready created a room for this contact combination
                // only create new one, if not existant
                if (data.length == 0) {
                    this.matrixServer.createRoom(from, to)
                        .then((result) => {
                            this.database.insert({
                                xmpp_external: from,
                                xmpp_internal: to,
                                matrix: result.room_id
                            }); //TODO error handling insert
                        })
                        .catch((err) => {
                            debug(err);
                        });
                } else {
                    debug("Auth request duplicate");
                    // TODO poke user on re-request
                }
            });

    }

    handleXmppMessage(from, to, message) {
        from = from.split('/')[0]; //todo use xmpp core JID class?
        to = to.split('/')[0];

        this._findRoomData(from, to)
            .then((data) => {
                if (data.length > 0) {
                    let roomData = data[0];
                    this.matrixServer.sendMessage(roomData.xmpp_external, roomData.matrix, message);
                } else {
                    debug("Incoming message for unsubscribed user"); //TODO proper xmpp response? Resending after subscription?
                }
            })
            .catch((err) => {
                debug(err);
            });
    }

    _findRoomDataByRoomId(room_id) {
        let deferred = Q.defer();

        this.database.find({matrix: room_id}, (err, data) => {
            if (err) {
                deferred.reject(new Error(err))
            } else {
                deferred.resolve(data);
            }
        });

        return deferred.promise;
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