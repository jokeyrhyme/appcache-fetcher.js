'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');
var url = require('url');

// foreign modules

var pify = require('pify');
var test = require('ava');

// local modules

var Fetcher = require('..');
var pkg = require('../package.json');
var server = require('./fixtures/server');
var temp = require('./helpers/temp.js');

// this module

var fsp = pify(fs);

var FIXTURE_PATH = path.join(__dirname, 'fixtures', 'embedded-css');
var REMOTE_URL;

var AVAILABLE_RESOURCES = [
  'background.svg'
];

test.before(function () {
  return server.start({ port: 3002 })
    .then(function (origin) {
      REMOTE_URL = origin + '/embedded-css/';
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

test.serial('fetcher.go()', function (t) {
  return t.context.fetcher.go().then(() => t.pass());
});

var index;

test.serial('index.json populated correctly', function (t) {
  return t.context.fetcher.go()
    .then(function () {
      index = require(path.join(t.context.tempDir, 'index.json'));
      var remoteUrls = Object.keys(index);

      AVAILABLE_RESOURCES.map(function (resource) {
        return url.resolve(REMOTE_URL, resource);
      }).forEach(function (resource) {
        t.truthy(~remoteUrls.indexOf(resource));
      });
    });
});

test.serial('index.html downloaded and processed', function (t) {
  return t.context.fetcher.go()
    .then(function () {
      return Promise.all([
        fsp.readFile(path.join(t.context.tempDir, 'index.html'), 'utf8'),
        fsp.readFile(path.join(FIXTURE_PATH, 'index.html'), 'utf8')
      ]);
    })
    .then(function (results) {
      var stored = results[0];
      var original = results[1];

      t.not(stored, original);

      // confirm that available resources were properly substituted
      AVAILABLE_RESOURCES.forEach(function (resource) {
        t.falsy(~stored.indexOf('url(' + resource + ')'));
        t.truthy(~stored.indexOf('url(' + index[url.resolve(REMOTE_URL, resource)] + ')'));
      });
    });
});
