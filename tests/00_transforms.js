'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('tape');

// our modules

var injectRequireJsShim = require(path.join(__dirname, '..', 'lib', 'transforms', 'html.injectRequireJsShim'));

// this module

test('injectRequireJsShim', function (t) {

  t.test('html with no Require.js', function (tt) {
    var html = '<html><script src="blah.js"></script></html>';
    var out = injectRequireJsShim({ contents: html, filePath: 'index.html' });
    var expected = '<html><script src="blah.js"></script><script src="require.load.js"></script></html>';

    tt.equal(out, expected);

    tt.end();
  });

  t.test('html with Require.js', function (tt) {
    var html = '<html><script src="//cdn/require.min.js.gz"></script><script src="blah.js"></script></html>';
    var out = injectRequireJsShim({ contents: html, filePath: 'index.html' });
    var expected = '<html><script src="//cdn/require.min.js.gz"></script><script src="require.load.js"></script><script src="blah.js"></script></html>';

    tt.equal(out, expected);

    tt.end();
  });

  t.end();
});
