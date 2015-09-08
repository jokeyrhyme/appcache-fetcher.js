'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// foreign modules

var test = require('tape');

// our modules

var Fetcher = require('..');

// this module

test('protocol whitelist', function (t) {
  var fetcher = new Fetcher({ localPath: '/', remoteUrl: 'http://blah.com/' });
  var fixture;
  var parsed;

  t.test('load fixture: data-uri.appcache', function (tt) {
    var filePath = path.join(__dirname, 'fixtures', 'data-uri.appcache');
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, contents) {
      tt.error(err);
      fixture = contents;
      tt.ok(fixture);
      tt.isString(fixture);
      tt.end();
    });
  });

  t.test('Fetcher#saveAppCacheAsJSON() -> #writeFile()', function (tt) {
    fetcher.writeFile = function (filePath, json) {
      parsed = JSON.parse(json);
      tt.ok(parsed);
      tt.isObject(parsed);
      tt.end();
    };
    fetcher.saveAppCacheAsJSON(fixture);
  });

  t.test('parsed JSON has expected content', function (tt) {
    tt.lengthOf(parsed.cache, 4, 'all 4 CACHE entries found');
    tt.lengthOf(parsed.fallback, 0, 'no FALLBACK entries');
    tt.lengthOf(parsed.network, 0, 'no NETWORK entries');
    tt.end();
  });

  t.end();
});
