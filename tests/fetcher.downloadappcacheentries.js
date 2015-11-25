'use strict';

// Node.js built-ins

var path = require('path');

// foreign modules

var mockery = require('mockery');
var test = require('ava');

// local modules

var Fetcher = require('..');

// this module

var REMOTE_URL = 'http://github.com/';
var LOCAL_PATH = path.join('..', 'output');
var fetcher = new Fetcher({
  localPath: LOCAL_PATH,
  remoteUrl: REMOTE_URL,
  strictMode: false
});
var strictFetcher = new Fetcher({
  localPath: LOCAL_PATH,
  remoteUrl: REMOTE_URL
});

test.before(function (t) {
  mockery.enable({ useCleanCache: true });
  t.end();
});

test.after(function (t) {
  mockery.disable();
  t.end();
});

test('default (strict) fetcher halts after 404', function (t) {
  mockery.registerMock(path.resolve(path.join(LOCAL_PATH, 'appcache.json')), {
    cache: [
      '/non-existant/resource/from/somewhere/non-existant.txt'
    ]
  });
  strictFetcher.download = function () { return Promise.reject(new Error('404')); };

  strictFetcher.downloadAppCacheEntries()
  .then(function () {
    t.fail('resolved unexpectedly');
    t.end();
  })
  .catch(function () {
    t.pass('rejected as expected');
    t.end();
  });
});

test('non-strict fetcher gracefully continues after 404', function (t) {
  mockery.registerMock(path.resolve(path.join(LOCAL_PATH, 'appcache.json')), {
    cache: [
      '/non-existant/resource/from/somewhere/non-existant.txt'
    ]
  });
  fetcher.download = function () { return Promise.reject(new Error('404')); };

  fetcher.downloadAppCacheEntries()
  .then(function () {
    t.pass('resolved as expected');
    t.end();
  })
  .catch(function () {
    t.fail('rejected unexpectedly');
    t.end();
  });
});
