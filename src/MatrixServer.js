'use strict';
var EventEmitter = require('events').EventEmitter;
var restify = require('restify');
var config = require('../config.json');
var debug = require('debug')('mero:MatrixServer');
var Matrix = require("matrix-js-sdk");


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

    createRoom() {
        return this.matrixClient.createRoom({
            visibility: "private",
            invite: ["@skaverat:m.skaverat.net"]
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