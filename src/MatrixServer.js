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
        debug(req.body);
        debug(req.body.events);

        req.body.events.forEach((event) => {
            debug(event.content);
            if(event.content.membership == "join"){
                this.emit("matrix.room.join", event.room_id);
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