'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('tape');

// our modules

var utils = require(path.join(__dirname, '..', 'lib', 'utils'));

// this module

test('utils', function (t) {
  t.test('stripGZ', function (tt) {
    var fn = utils.stripGZ;
    tt.equal(fn('//cdn/path/file.js'), '//cdn/path/file.js');
    tt.equal(fn('//cdn/path/file.js.gz'), '//cdn/path/file.js');
    tt.equal(fn('//cdn/path/file.gz.js'), '//cdn/path/file.js');
    tt.equal(fn('/just/path/file.js'), '/just/path/file.js');
    tt.equal(fn('/just/path/file.js.gz'), '/just/path/file.js');
    tt.equal(fn('/just/path/file.gz.js'), '/just/path/file.js');
    tt.equal(fn('https://file.js'), 'https://file.js');
    tt.equal(fn('https://file.js.gz'), 'https://file.js');
    tt.equal(fn('https://file.gz.js'), 'https://file.js');

    tt.end();
  });

  t.end();
});
