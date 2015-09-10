'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('tape');

// our modules

var requirejsSrc = require(path.join(__dirname, '..', 'lib', 'extractors', 'requirejsSrc'));

// this module

test('requirejsSrc', function (t) {
  t.test('html with no Require.js', function (tt) {
    var html = '<html><script src="blah.js"></script></html>';

    var srcs = requirejsSrc({ contents: html });
    tt.isArray(srcs);
    tt.lengthOf(srcs, 0);

    tt.end();
  });

  t.test('html with Require.js', function (tt) {
    var html = '<html><script src="//cdn/require.min.js"></script><script src="blah.js"></script></html>';

    var srcs = requirejsSrc({ contents: html });
    tt.isArray(srcs);
    tt.lengthOf(srcs, 1);
    tt.deepEqual(srcs, ['//cdn/require.min.js']);

    tt.end();
  });

  t.end();
});
