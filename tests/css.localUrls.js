'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// foreign modules

var test = require('ava');

// local modules

var cssLocalUrls = require('../lib/transforms/css.localUrls.js');
var FetcherIndex = require('../www/fetcher-index.js');

// this module

var fetcherIndex = new FetcherIndex({ remoteUrl: 'https://my.app/' });

var LOCAL_CSS_FILE = path.join(__dirname, 'fixtures', 'css-url.css');

test.before(function () {
  fetcherIndex.set('https://my.cdn/image.jpeg', 'abcdefg.jpeg');
  fetcherIndex.set('https://my.app/main.css', path.basename(LOCAL_CSS_FILE));
});

test('url() no quotes', function (t) {
  var filePath = path.join(__dirname, 'fixtures', 'css-url.css');
  var css = fs.readFileSync(filePath, 'utf8');
  var result = cssLocalUrls({
    contents: css,
    filePath: LOCAL_CSS_FILE,
    index: fetcherIndex
  });
  t.regex(result, /url\(abcdefg.jpeg\)/);
});

test('url() double quotes', function (t) {
  var filePath = path.join(__dirname, 'fixtures', 'css-url-double-quotes.css');
  var css = fs.readFileSync(filePath, 'utf8');
  var result = cssLocalUrls({
    contents: css,
    filePath: LOCAL_CSS_FILE,
    index: fetcherIndex
  });
  t.regex(result, /url\(abcdefg.jpeg\)/);
});

test('url() single quotes', function (t) {
  var filePath = path.join(__dirname, 'fixtures', 'css-url-single-quotes.css');
  var css = fs.readFileSync(filePath, 'utf8');
  var result = cssLocalUrls({
    contents: css,
    filePath: LOCAL_CSS_FILE,
    index: fetcherIndex
  });
  t.regex(result, /url\(abcdefg.jpeg\)/);
});
