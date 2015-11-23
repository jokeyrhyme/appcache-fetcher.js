'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('ava');

// our modules

var injectRequireJsShim = require(path.join(__dirname, '..', 'lib', 'transforms', 'html.injectRequireJsShim'));

// this module

test('html with no Require.js', function (t) {
  var html = '<html><script src="blah.js"></script></html>';
  var out = injectRequireJsShim({ contents: html, filePath: 'index.html' });
  var expected = '<html><script src="blah.js"></script><script src="require.load.js"></script></html>';

  t.is(out, expected);

  t.end();
});

test('html with Require.js', function (t) {
  var html = '<html><script src="//cdn/require.min.js.gz"></script><script src="blah.js"></script></html>';
  var out = injectRequireJsShim({ contents: html, filePath: 'index.html' });
  var expected = '<html><script src="//cdn/require.min.js.gz"></script><script src="require.load.js"></script><script src="blah.js"></script></html>';

  t.is(out, expected);

  t.end();
});
