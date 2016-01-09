'use strict';
var   EventEmitter = require('events').EventEmitter
    , restify = require('restify')
    , config = require('../config.json')
    , debug = require('debug')('mero:MatrixServer')
    , Matrix = require("matrix-js-sdk")
    , _ = require('util')
    , Q = require('q')
    , request = require('request')
    ;


class MatrixServer extends EventEmitter {
    constructor() {
        super();
        var server = restify.createServer();
        server.use(restify.bodyParser({}));
        server.put('/transactions/:transaction', this.handleIncoming.bind(this));
        server.listen(config.mx.app_port,'0.0.0.0', () => {
            debug("Matrix Appserver listening on " + config.mx.app_port)
        });
    }

    registerUser(jid) {
        let deferred = Q.defer();

        request.post({
            url: 'https://' + config.mx.host + ':' + config.mx.port + '/_matrix/client/api/v1/register',
            body: {
                user: 'mero_' + jid,
                type: 'm.login.application_service'
            },
            json: true,
            qs: {
                access_token: config.mx.access_token
            }
        }, function (err, res, body) {
            if(body.access_token || body.errcode == 'M_USER_IN_USE') {
                deferred.resolve();
            }else{
                deferred.reject(body.errcode);
            }
          });

        return deferred.promise;
    }

    createRoom(invitedby, invite) {
        let usernameParts = invite.split('@');
        let matrixClient = MatrixServer._getMatrixConnection(invitedby);

        return this.registerUser(invitedby)
            .then(() => {
                return matrixClient.createRoom({
                    visibility: "private",
                    invite: [_.format("@%s:%s", usernameParts[0], config.mx.host)] //@local:remote.tld
                    })
                    .then((roomdata) => {
                        matrixClient.setRoomName(roomdata.room_id, _.format("%s (XMPP)", invitedby))
                        .catch((err) => {
                            debug(err);
                        });
                        matrixClient.setDisplayName(invitedby)
                        .catch((err) => {
                            debug(err);
                        });

                        return roomdata;
                    })
                    .catch((err) => {
                        debug(err);
                    });
            })
          .catch((err) => {
              console.log("User create fail: " + err);
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

  /**
   *
   * @param user JID
   * @param name new displayname
   */
    setDisplayname(user, name) {
        let matrixClient = MatrixServer._getMatrixConnection(user);

        matrixClient.setDisplayName(name)
          .then(() => {
              debug("displayname success!");
          })
          .catch((e) => {
              debug("displayname fail!");
              debug(e)
          });
    }

    setPresence(user, status) {
        let matrixClient = MatrixServer._getMatrixConnection(user);

        let presence = 'online';
        switch (status) {
            case 'xa':
            case 'away':
            case 'dnd':
                presence = 'unavailable';
                break;
            case 'online':
            case 'chat':
                presence = 'online';
                break;
            case 'offline':
                presence = 'offline';
                break;
        }

        matrixClient.setPresence(presence)
        .then(() => {
            debug("presence success!");
        })
        .catch((e) => {
            debug("presence fail!");
            debug(e)
        });
    }

    setPowerlevel(from, to, level) {
        let matrixClient = MatrixServer._getMatrixConnection(from);

        matrixClient.setPowerLevel()
          .then(() => {
              debug("presence success!");
          })
          .catch((e) => {
              debug("presence fail!");
              debug(e)
          });
    }

    handleIncoming(req, res, next) {
        debug("incoming");
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
            userId: '@mero_' + jidParts[0] + ':' + config.mx.host
        });

    }
}

module.exports = MatrixServer;