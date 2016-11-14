/* eslint-disable no-sync */ // tests can be synchronous, relax!

'use strict';

// Node.js built-ins

var path = require('path');

// 3rd-party modules

var test = require('ava');

// our modules

var Fetcher = require('..');

// this module

// change the working directory to support running from any location
process.chdir(path.join(__dirname));

test('Fetcher', function (t) {
  t.is(typeof Fetcher, 'function');
});

test('https://domain.com/example', function (t) {
  var variations = Fetcher.getURLVariationsOnScheme('https://domain.com/example');
  t.deepEqual(variations, [
    'https://domain.com/example',
    'http://domain.com/example'
  ]);
});

test('http://domain.com/example', function (t) {
  var variations = Fetcher.getURLVariations('http://domain.com/example');
  t.deepEqual(variations, [
    'https://domain.com/example',
    'http://domain.com/example'
  ]);
});

test('https://domain.com/example', function (t) {
  var variations = Fetcher.getURLVariationsOnScheme('https://domain.com/example');
  t.deepEqual(variations, [
    'https://domain.com/example',
    'http://domain.com/example'
  ]);
});

test('http://domain.com/example', function (t) {
  var variations = Fetcher.getURLVariations('http://domain.com/example');
  t.deepEqual(variations, [
    'https://domain.com/example',
    'http://domain.com/example'
  ]);
});

test('http://domain.com/example?abc&def=ghi', function (t) {
  var variations = Fetcher.getURLVariationsOnQuery('http://domain.com/example?abc&def=ghi');
  t.deepEqual(variations, [
    'http://domain.com/example?abc&def=ghi',
    'http://domain.com/example?def=ghi',
    'http://domain.com/example?abc=',
    'http://domain.com/example'
  ]);
});

test('http://domain.com/example?abc&def=ghi', function (t) {
  var variations = Fetcher.getURLVariations('http://domain.com/example?abc&def=ghi');
  t.deepEqual(variations, [
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
});
