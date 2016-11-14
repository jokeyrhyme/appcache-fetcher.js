'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// foreign modules

var test = require('ava');

// our modules

var Fetcher = require('..');

// this module

var fetcher = new Fetcher({ localPath: '/', remoteUrl: 'http://blah.com/' });
var fixture;
var parsed;

test.serial.cb('load fixture: data-uri.appcache', function (t) {
  var filePath = path.join(__dirname, 'fixtures', 'data-uri.appcache');
  fs.readFile(filePath, { encoding: 'utf8' }, function (err, contents) {
    t.error(err);
    fixture = contents;
    t.truthy(fixture);
    t.is(typeof fixture, 'string');
    t.end();
  });
});

test.serial.cb('Fetcher#saveAppCacheAsJSON() -> #writeFile()', function (t) {
  fetcher.writeFile = function (filePath, json) {
    parsed = JSON.parse(json);
    t.truthy(parsed);
    t.is(typeof parsed, 'object');
    t.end();
  };
  fetcher.saveAppCacheAsJSON(fixture);
});

test.serial.cb('parsed JSON has expected content', function (t) {
  t.is(parsed.cache.length, 3, 'all 3 CACHE entries found');
  t.deepEqual(parsed.cache, [
    'http://google.com/',
    'https://github.com/',
    'image.jpeg'
  ]);
  t.is(parsed.fallback.length, 0, 'no FALLBACK entries');
  t.is(parsed.network.length, 0, 'no NETWORK entries');
  t.end();
});
