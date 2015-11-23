'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('ava');

// our modules

var requirejsSrc = require(path.join(__dirname, '..', 'lib', 'extractors', 'requirejsSrc'));

// this module

test('html with no Require.js', function (t) {
  var html = '<html><script src="blah.js"></script></html>';

  var srcs = requirejsSrc({ contents: html });
  t.ok(Array.isArray(srcs));
  t.is(srcs.length, 0);

  t.end();
});

test('html with Require.js', function (t) {
  var html = '<html><script src="//cdn/require.min.js"></script><script src="blah.js"></script></html>';

  var srcs = requirejsSrc({ contents: html });
  t.ok(Array.isArray(srcs));
  t.is(srcs.length, 1);
  t.same(srcs, ['//cdn/require.min.js']);

  t.end();
});
