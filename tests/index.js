/*eslint-disable no-sync*/ // tests can be synchronous, relax!

'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('tape');

// our modules

var Fetcher = require('..');

// this module

require('tape-chai');

// change the working directory to support running from any location
process.chdir(path.join(__dirname));

test('Fetcher', function (t) {
  t.isFunction(Fetcher);
  t.end();
});

test('Fetcher.getURLVariations()', function (t) {
  t.test('https://domain.com/example', function (tt) {
    var variations = Fetcher.getURLVariationsOnScheme('https://domain.com/example');
    tt.deepEqual(variations, [
      'https://domain.com/example',
      'http://domain.com/example'
    ]);
    tt.end();
  });

  t.test('http://domain.com/example', function (tt) {
    var variations = Fetcher.getURLVariations('http://domain.com/example');
    tt.deepEqual(variations, [
      'https://domain.com/example',
      'http://domain.com/example'
    ]);
    tt.end();
  });

  t.test('https://domain.com/example', function (tt) {
    var variations = Fetcher.getURLVariationsOnScheme('https://domain.com/example');
    tt.deepEqual(variations, [
      'https://domain.com/example',
      'http://domain.com/example'
    ]);
    tt.end();
  });

  t.test('http://domain.com/example', function (tt) {
    var variations = Fetcher.getURLVariations('http://domain.com/example');
    tt.deepEqual(variations, [
      'https://domain.com/example',
      'http://domain.com/example'
    ]);
    tt.end();
  });

  t.test('http://domain.com/example?abc&def=ghi', function (tt) {
    var variations = Fetcher.getURLVariationsOnQuery('http://domain.com/example?abc&def=ghi');
    tt.deepEqual(variations, [
      'http://domain.com/example?abc&def=ghi',
      'http://domain.com/example?def=ghi',
      'http://domain.com/example?abc=',
      'http://domain.com/example'
    ]);
    tt.end();
  });

  t.test('http://domain.com/example?abc&def=ghi', function (tt) {
    var variations = Fetcher.getURLVariations('http://domain.com/example?abc&def=ghi');
    tt.deepEqual(variations, [
      'https://domain.com/example?abc&def=ghi',
      'http://domain.com/example?abc&def=ghi'
      // disable this for now
      // 'https://domain.com/example?def=ghi',
      // 'http://domain.com/example?def=ghi',
      // 'https://domain.com/example?abc=',
      // 'http://domain.com/example?abc=',
      // 'https://domain.com/example',
      // 'http://domain.com/example'
    ]);
    tt.end();
  });

  t.end();
});

require(path.join(__dirname, '00_extractors'));
require(path.join(__dirname, '00_protocol_whitelist'));
require(path.join(__dirname, '00_shim_jquery_ajax'));
require(path.join(__dirname, '00_transforms'));
require(path.join(__dirname, '00_utils'));

require(path.join(__dirname, '01_everytimezone'));

require(path.join(__dirname, '01_devdocs'));
