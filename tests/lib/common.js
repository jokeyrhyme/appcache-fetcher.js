/*eslint-disable no-sync*/ // tests can be synchronous, relax!

'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// foreign modules

var test = require('ava');

// this module

var NEW_JS = ['appCacheIndex.js', 'require.load.js'];

module.exports = {

  makeAppCacheTests: function (outputPath) {
    test.serial('appcache.manifest', function (tt) {
      tt.ok(fs.existsSync(path.join(outputPath, 'appcache.manifest')));
      tt.end();
    });

    test.serial('appcache.json', function (tt) {
      var appCache;
      tt.ok(fs.existsSync(path.join(outputPath, 'appcache.json')));
      tt.doesNotThrow(function () {
        delete require.cache[path.join(outputPath, 'appcache.json')];
        appCache = require(path.join(outputPath, 'appcache.json'));
      });
      tt.is(typeof appCache, 'object');
      tt.ok(Array.isArray(appCache.cache));
      tt.end();
    });
  },

  makeCSSTests: function (outputPath) {
    test.serial('CSS tests', function (ttt) {
      var files = fs.readdirSync(outputPath);
      files = files.filter(function (filename) {
        return path.extname(filename) === '.css';
      });

      files.forEach(function (filename) {
        var filePath = path.join(outputPath, filename);

        var contents = fs.readFileSync(filePath, { encoding: 'utf8' });
        var matches = contents.match(/url\([''\s]*[^\(\)]+[''\s]*\)/g);
        if (Array.isArray(matches)) {
          matches.forEach(function (cssUrlStmt) {
            var cssUrl = cssUrlStmt.replace(/url\([''\s]*([^\(\)]+)[''\s]*\)/, '$1');
            if (cssUrl.indexOf('data:') === 0) {
              return; // don't bother with Data URIs
            }
            ttt.not(cssUrl.indexOf('//'), 0, cssUrl + ' not protocol-relative');
            ttt.not(cssUrl.indexOf('http://'), 0, cssUrl + ' not remote HTTP');
            ttt.not(cssUrl.indexOf('https://'), 0, cssUrl + ' not remote HTTPS');
            ttt.ok(fs.existsSync(path.join(outputPath, cssUrl)), cssUrl + ' local exists');
          });
        }
      });
      ttt.end();
    });
  },

  makeJavaScriptTests: function (outputPath) {
    test.serial('appCacheIndex.js exists', function (tt) {
      tt.ok(fs.existsSync(path.join(outputPath, 'appCacheIndex.js')));
      tt.end();
    });

    // __dirname is a symptom of weird module paths that break in the app
    test.serial('appCacheIndex.js does not contain "__dirname"', function (tt) {
      var contents = fs.readFileSync(
        path.join(outputPath, 'appCacheIndex.js'),
        { encoding: 'utf8' }
      );
      tt.not(~contents.indexOf('__dirname'));
      tt.end();
    });

    test.serial('require.load.js exists', function (tt) {
      tt.ok(fs.existsSync(path.join(outputPath, 'require.load.js')));
      tt.end();
    });

    // __dirname is a symptom of weird module paths that break in the app
    test.serial('require.load.js does not contain "__dirname"', function (tt) {
      var contents = fs.readFileSync(
        path.join(outputPath, 'require.load.js'),
        { encoding: 'utf8' }
      );
      tt.not(~contents.indexOf('__dirname'));
      tt.end();
    });
  },

  makeIndexJSONTests: function (outputPath, remoteUrl) {
    test.serial('index.json', function (tt) {
      var index;
      tt.ok(fs.existsSync(path.join(outputPath, 'index.json')));
      tt.doesNotThrow(function () {
        delete require.cache[path.join(outputPath, 'index.json')];
        index = require(path.join(outputPath, 'index.json'));
      });
      tt.is(typeof index, 'object');
      tt.is(index[remoteUrl], 'index.html');
      tt.end();
    });
  },

  testHTMLLinkHref: function ($, tt) {
    $('link[href]').each(function () {
      var el$ = $(this);
      var href = el$.attr('href');
      if (href) {
        tt.ok(el$.attr('data-appcache-href'));
        tt.not(href.indexOf('//'), 0);
        tt.not(href.indexOf('http://'));
        tt.not(href.indexOf('https://'));
      }
    });
  },

  testHTMLScriptSrc: function ($, tt) {
    $('script[src]').each(function () {
      var el$ = $(this);
      var href = el$.attr('src');
      if (href && NEW_JS.indexOf(href) === -1) {
        tt.ok(el$.attr('data-appcache-src'));
        tt.not(href.indexOf('//'), 0);
        tt.not(href.indexOf('http://'));
        tt.not(href.indexOf('https://'));
      }
    });
  }

};
