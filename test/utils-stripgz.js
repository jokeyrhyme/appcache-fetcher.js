'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('ava');

// our modules

var utils = require(path.join(__dirname, '..', 'lib', 'utils'));

// this module

test('utils.stripGZ', function (t) {
  var fn = utils.stripGZ;
  t.is(fn('//cdn/path/file.js'), '//cdn/path/file.js');
  t.is(fn('//cdn/path/file.js.gz'), '//cdn/path/file.js');
  t.is(fn('//cdn/path/file.gz.js'), '//cdn/path/file.js');
  t.is(fn('/just/path/file.js'), '/just/path/file.js');
  t.is(fn('/just/path/file.js.gz'), '/just/path/file.js');
  t.is(fn('/just/path/file.gz.js'), '/just/path/file.js');
  t.is(fn('https://abc.xyz/file.js'), 'https://abc.xyz/file.js');
  t.is(fn('https://abc.xyz/file.js.gz'), 'https://abc.xyz/file.js');
  t.is(fn('https://abc.xyz/file.gz.js'), 'https://abc.xyz/file.js');
  t.is(fn(undefined), '');
  t.is(fn(null), '');
});
