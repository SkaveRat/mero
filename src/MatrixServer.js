'use strict';
var   EventEmitter = require('events').EventEmitter
    , restify = require('restify')
    , config = require('../config.json')
    , debug = require('debug')('mero:MatrixServer')
    , Matrix = require("matrix-js-sdk")
    , _ = require('util')
    ;


class MatrixServer extends EventEmitter {
    constructor() {
        super();
        var server = restify.createServer();
        server.use(restify.bodyParser({}));
        server.put('/transactions/:transaction', this.handleIncoming.bind(this));
        server.listen(config.mx.app_port, () => {
            debug("Matrix Appserver listening on " + config.mx.app_port)
        });
    }

    createRoom(invitedby, invite) {
        let usernameParts = invite.split('@');
        let matrixClient = MatrixServer._getMatrixConnection(invitedby);

        return matrixClient.createRoom({
            visibility: "private",
            invite: [_.format("@%s:%s", usernameParts[0], config.mx.host)] //@local:remote.tld
        });
    }

    /**
     * send a message from xmpp to matrix
     * @param from sender JID
     * @param to matrix room_id
     * @param message
     */
    sendMessage(from, to, message) {
        let matrixClient = MatrixServer._getMatrixConnection(from);

        matrixClient.sendTextMessage(to, message)
        .then(function (foo) {
            debug(foo);
        })
        .catch(function (foo) {
            debug(foo);
        });
    }

    handleIncoming(req, res, next) {
        debug(req.body.events);

        req.body.events.forEach((event) => {
            switch (event.type) {
                case 'm.room.member':
                    if(event.content.membership == "join"){
                        this.emit("matrix.room.join", event.room_id);
                    }
                    break;
                case 'm.room.message':
                    let from = event.user_id;
                    let room_id = event.room_id;
                    let message = event.content.body;
                    this.emit("matrix.room.message", from, room_id, message);
                    break;
                default:
                    debug("Unhandled event type '%s'", event.type);
            }


        });

        res.send("[]");
        next();
    }

    /**
     * @param jid Sender JID
     * @returns MatrixClient
     * @private
     */
    static _getMatrixConnection(jid) {

        let jidParts = jid.split('/');

        return Matrix.createClient({
            baseUrl: 'https://' + config.mx.host + ':' + config.mx.port,
            queryParams: {
                user_id: '@mero_' + jidParts[0] + ':' + config.mx.host
            },
            accessToken: config.mx.access_token,
            userId: '@mero:' + config.mx.host
        });

    }
}

module.exports = MatrixServer;