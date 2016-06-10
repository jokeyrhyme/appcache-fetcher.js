'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// foreign modules

var pify = require('pify');
var temp = pify(require('temp').track());
var test = require('ava');

// local modules

var Fetcher = require('..');
var pkg = require('../package.json');
var server = require('./fixtures/server');

// this module

var fsp = pify(fs);

var FIXTURE_PATH = path.join(__dirname, 'fixtures', 'missing-resource');
var REMOTE_URL;

test.before(function () {
  return server.start({ port: 3001 })
    .then(function (origin) {
      REMOTE_URL = origin + '/missing-resource/';
    });
});

test.after(function () {
  return server.stop();
});

test.beforeEach((t) => {
  return temp.mkdir(pkg.name.replace(/\//g, '-') + '-')
    .then((dirPath) => {
      t.context.tempDir = dirPath;
      t.context.fetcher = new Fetcher({
        localPath: dirPath,
        remoteUrl: REMOTE_URL
      });
    });
});

test.serial('fetcher.go() fails', function (t) {
  return t.context.fetcher.go()
    .catch(function (err) {
      t.truthy(err);
    });
});

test.serial('index.html downloaded and unmodified', function (t) {
  return t.context.fetcher.go()
    .catch(function (err) {
      t.truthy(err);
    })
    .then(function () {
      return Promise.all([
        fsp.readFile(path.join(t.context.tempDir, 'index.html'), 'utf8'),
        fsp.readFile(path.join(FIXTURE_PATH, 'index.html'), 'utf8')
      ]);
    })
    .then(function (results) {
      t.is(results[0], results[1]);
    });
});
