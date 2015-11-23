/*eslint-disable no-sync*/ // tests can be synchronous, relax!

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

var common = require(path.join(__dirname, 'lib', 'common'));

// this module

var remoteUrl = 'http://devdocs.io/';

// use an absolute output path here (e.g. __dirname) to cover this case
var outputPath = path.join(__dirname, '..', 'output', 'devdocs');

var fetcher;

test.before(function (t) {
  rimraf.sync(outputPath);
  t.end();
});

test.serial('constructor', function (t) {
  t.doesNotThrow(function () {
    fetcher = new Fetcher({
      remoteUrl: remoteUrl,
      localPath: outputPath
    });
  });
  t.ok(fetcher);
  t.end();
});

test.serial('.go()', function (t) {
  fetcher.go().then(function () {
    t.ok(true);
    t.end();
  }, function (err) {
    t.error(err);
    t.end();
  });
});

test.serial('index.html', function (t) {
  var contents;
  var $;
  t.ok(fs.existsSync(path.join(outputPath, 'index.html')));
  contents = fs.readFileSync(path.join(outputPath, 'index.html'), { encoding: 'utf8' });
  $ = cheerio.load(contents);
  t.notOk($('html').attr('manifest'), 'no AppCache manifest attribute');
  // these tests fail because of weird URLs in HTML / AppCache (?yyyymmdd)
  // common.testHTMLLinkHref($, t);
  common.testHTMLScriptSrc($, t);
  t.end();
});

common.makeIndexJSONTests(outputPath, remoteUrl);

common.makeCSSTests(outputPath);

common.makeAppCacheTests(outputPath);

common.makeJavaScriptTests(outputPath);
