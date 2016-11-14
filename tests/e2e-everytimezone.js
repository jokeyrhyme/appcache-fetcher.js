/* eslint-disable no-sync */ // tests can be synchronous, relax!

'use strict';

// Node.js built-ins

var fs = require('fs');
var path = require('path');

// 3rd-party modules

var cheerio = require('cheerio');
var rimraf = require('rimraf');
var test = require('ava');

// our modules

var Fetcher = require('..');

var common = require(path.join(__dirname, 'helpers', 'common'));

// this module

var remoteUrl = 'http://everytimezone.com/';

// use a relative output path here to cover this case
var relativeOutputPath = path.join('..', 'output', 'everytimezone');
var outputPath = path.resolve(relativeOutputPath);

var fetcher;

test.before(function (t) {
  rimraf.sync(outputPath);
});

test.serial('constructor', function (t) {
  t.notThrows(function () {
    fetcher = new Fetcher({
      remoteUrl: remoteUrl,
      localPath: relativeOutputPath
    });
  });
  t.truthy(fetcher);
});

test.serial('.go()', function (t) {
  return fetcher.go();
});

test.serial('index.html', function (t) {
  var contents;
  var $;
  t.truthy(fs.existsSync(path.join(outputPath, 'index.html')));
  contents = fs.readFileSync(path.join(outputPath, 'index.html'), { encoding: 'utf8' });
  $ = cheerio.load(contents);
  t.falsy($('html').attr('manifest'), 'no AppCache manifest attribute');
  common.testHTMLLinkHref($, t);
  // these tests fail because of weird URLs in HTML / AppCache (?yyyymmdd)
  // common.testHTMLScriptSrc($, t);
});

common.makeIndexJSONTests(outputPath, remoteUrl);

// these tests fail because of weird URLs in HTML / AppCache (?yyyymmdd)
// common.makeCSSTests(outputPath);

common.makeAppCacheTests(outputPath);

common.makeJavaScriptTests(outputPath);
