'use strict';
var Server = require('./src/Server');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var s = new Server();
