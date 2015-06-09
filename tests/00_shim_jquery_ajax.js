'use strict';

// 3rd-party modules

var test = require('tape');

// our modules

var FetcherIndex = require('../lib/fetcher-index');

// this modules

test('shim: jQuery.ajax', function (t) {
  var $ = {};

  test('empty index', function (tt) {
    var fetcherIndex = new FetcherIndex({ remoteUrl: 'http://example.com/' });
    var args;
    $.ajax = function () {
      return Array.prototype.slice.call(arguments, 0);
    };
    require('../lib/shims/jquery.ajax')(fetcherIndex, $, 'ajax');

    args = [];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [ { method: 'GET' } ];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [
      'http://example.com/remote-abc.js',
      { method: 'GET' }
    ];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [ { url: 'http://example.com/remote-abc.js', method: 'GET' } ];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [
      'http://example.com/remote-abc.js',
      { url: 'http://example.com/remote-def.js', method: 'GET' }
    ];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    tt.end();
  });

  test('matching index', function (tt) {
    var fetcherIndex = new FetcherIndex({ remoteUrl: 'http://example.com/' });
    var args, expected;
    $.ajax = function () {
      return Array.prototype.slice.call(arguments, 0);
    };
    require('../lib/shims/jquery.ajax')(fetcherIndex, $, 'ajax');

    fetcherIndex.set('http://example.com/remote-abc.js', 'local-abc.js');
    fetcherIndex.set('http://example.com/remote-def.js', 'local-def.js');

    args = [];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [ { method: 'GET' } ];
    tt.deepEqual($.ajax.apply($, args), args, JSON.stringify(args) + ': noop');

    args = [
      'http://example.com/remote-abc.js',
      { method: 'GET' }
    ];
    expected = [
      'local-abc.js',
      { method: 'GET' }
    ];
    tt.deepEqual($.ajax.apply($, args), expected, JSON.stringify(args) + ': correct');

    args = [ { url: 'http://example.com/remote-abc.js', method: 'GET' } ];
    expected = [ { url: 'local-abc.js', method: 'GET' } ];
    tt.deepEqual($.ajax.apply($, args), expected, JSON.stringify(args) + ': correct');

    args = [
      'http://example.com/remote-abc.js',
      { url: 'http://example.com/remote-def.js', method: 'GET' }
    ];
    expected = [
      'local-abc.js',
      { url: 'local-def.js', method: 'GET' }
    ];
    tt.deepEqual($.ajax.apply($, args), expected, JSON.stringify(args) + ': correct');

    tt.end();
  });

  t.end();
});
