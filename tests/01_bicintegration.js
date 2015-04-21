/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// Node.js built-ins

var fs = require("fs");
var path = require("path");

// 3rd-party modules

var cheerio = require("cheerio");
var rimraf = require("rimraf");
var test = require("tape");

// our modules

var Fetcher = require("..");

// this module

var outputPath = path.join(process.cwd(), "output");

test("new Fetcher({ remoteUrl: 'http://blinkm.co/integration' })", function (t) {
  var fetcher;

  t.test("constructor", function (tt) {
    rimraf.sync(outputPath);

    tt.doesNotThrow(function () {
      fetcher = new Fetcher({
        remoteUrl: "http://blinkm.co/integration",
        localPath: outputPath
      });
    });
    tt.ok(fetcher);
    tt.end();
  });

  t.test(".go()", function (tt) {
    fetcher.go().then(function () {
      tt.ok(true);
      tt.end();
    }, function (err) {
      tt.error(err);
      tt.end();
    });
  });

  t.test("index.html", function (tt) {
    var contents;
    var $;
    tt.ok(fs.existsSync(path.join(outputPath, "index.html")));
    contents = fs.readFileSync(path.join(outputPath, "index.html"), { encoding: "utf8" });
    $ = cheerio.load(contents);
    tt.notOk($("html").attr("manifest"), "no AppCache manifest attribute");
    $("link[href]").each(function () {
      var el$ = $(this);
      var href = el$.attr("href");
      if (href) {
        tt.notEqual(href.indexOf("//"), 0, "link[href]: " + href);
        tt.notEqual(href.indexOf("http://"), 0, "link[href]: " + href);
        tt.notEqual(href.indexOf("https://"), 0, "link[href]: " + href);
      }
    });
    $("script[src]").each(function () {
      var el$ = $(this);
      var href = el$.attr("src");
      if (href) {
        tt.notEqual(href.indexOf("//"), 0, "script[src]: " + href);
        tt.notEqual(href.indexOf("http://"), 0, "script[src]: " + href);
        tt.notEqual(href.indexOf("https://"), 0, "script[src]: " + href);
      }
    });
    tt.end();
  });

  t.test("index.json", function (tt) {
    var index;
    tt.ok(fs.existsSync(path.join(outputPath, "index.json")));
    tt.doesNotThrow(function () {
      delete require.cache[path.join(outputPath, "index.json")];
      index = require(path.join(outputPath, "index.json"));
    });
    tt.isObject(index);
    tt.equal(index["http://blinkm.co/integration"], "index.html");
    tt.end();
  });

  t.test("appcache.manifest", function (tt) {
    tt.ok(fs.existsSync(path.join(outputPath, "appcache.manifest")));
    tt.end();
  });

  t.test("appcache.json", function (tt) {
    var appCache;
    tt.ok(fs.existsSync(path.join(outputPath, "appcache.json")));
    tt.doesNotThrow(function () {
      delete require.cache[path.join(outputPath, "appcache.json")];
      appCache = require(path.join(outputPath, "appcache.json"));
    });
    tt.isObject(appCache);
    tt.isArray(appCache.cache);
    tt.end();
  });

});
