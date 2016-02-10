'use strict';

// foreign modules

var Hapi = require('hapi');
var Inert = require('inert');
var pify = require('pify');

// this module

var server = new Hapi.Server();

server.register(Inert, function () {});

module.exports.start = function (options) {
  server.connection({ port: options.port });

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: { directory: { path: __dirname } }
  });

  return pify(server.start.bind(server))()
    .catch(function (err) {
      if (err.code === 'EADDRINUSE') {
        // we must already have a test server running, relax!
        return;
      }
      throw err;
    })
    .then(function () {
      return 'http://localhost:' + options.port;
    });
};

module.exports.stop = function () {
  return pify(server.stop.bind(server))();
};
