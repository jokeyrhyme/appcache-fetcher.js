'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');
var url = require('url');

// foreign modules

var pify = require('pify');
var temp = pify(require('temp'));
var test = require('ava');

// local modules

var Fetcher = require('..');
var pkg = require('../package.json');
var server = require('./fixtures/server');

// this module

// CIs don't need this auto-teardown, just developer machines
if (!process.env.CI) {
  temp.track();
}

var fsp = pify(fs);

var FIXTURE_PATH = path.join(__dirname, 'fixtures', 'missing-resource');
var REMOTE_URL;

var AVAILABLE_RESOURCES = [
  'main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.js',
  'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore.js',
  'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.4.9/angular.js'
];

test.before(function () {
  return server.start({ port: 3000 })
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
        remoteUrl: REMOTE_URL,
        strictMode: false
      });
    });
});

test.serial('fetcher.go()', function (t) {
  return t.context.fetcher.go();
});

test.serial('index.json populated correctly', function (t) {
  return t.context.fetcher.go()
    .then(function () {
      var index = require(path.join(t.context.tempDir, 'index.json'));
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
        t.falsy(~stored.indexOf(' src="' + resource + '"'));
        t.truthy(~stored.indexOf(' data-appcache-src="' + resource + '"'));
      });

      t.truthy(/\ssrc="[^"]+missing\.js"/.test(stored));
    });
});
