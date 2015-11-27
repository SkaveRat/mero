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
        server.put('/transactions/:transaction', this.handleIncoming);
        server.listen(config.mx.app_port, () => {
            debug("Matrix Appserver listening on " + config.mx.app_port)
        });

        this.matrixClient = Matrix.createClient({
            baseUrl: 'https://' + config.mx.host + ':' + config.mx.port,
            queryParams: {
                user_id: '@mero_' + 'changeme' + ':' + config.mx.host
            },
            accessToken: config.mx.access_token,
            userId: '@mero:' + config.mx.host
        });

        //this.matrixClient.startClient();

    }

    createRoom(invite) {
        let usernameParts = invite.split('@');

        return this.matrixClient.createRoom({
            visibility: "private",
            invite: [_.format("@%s:%s", usernameParts[0], config.mx.host)] //@local:remote.tld
        });
    }

    sendMessage(from, to, message) {
        this.matrixClient.sendTextMessage(to, message)
        .then(function (foo) {
            debug(foo);
        })
        .catch(function (foo) {
            debug(foo);
        });
    }

    handleIncoming(req, res, next) {
        debug("incoming");

        res.send("[]");
        next();
    }
}

module.exports = MatrixServer;