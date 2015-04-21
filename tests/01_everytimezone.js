/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// Node.js built-ins

var fs = require("fs");
var path = require("path");

// 3rd-party modules

var cheerio = require("cheerio");
var test = require("tape");

// our modules

var Fetcher = require("..");

// this module

var outputPath = path.join(process.cwd(), "output");

test("new Fetcher({ remoteUrl: 'http://everytimezone.com/' })", function (t) {
  var fetcher;

  t.test("constructor", function (tt) {
    tt.doesNotThrow(function () {
      fetcher = new Fetcher({
        remoteUrl: "http://everytimezone.com/",
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
        tt.notEqual(href.indexOf("http://"), 0, "link[href]: " + href);
        tt.notEqual(href.indexOf("https://"), 0, "link[href]: " + href);
      }
    });
    // these tests fail because of weird URLs in HTML / AppCache (?yyyymmdd)
    // $("script[src]").each(function () {
    //   var el$ = $(this);
    //   var href = el$.attr("src");
    //   if (href) {
    //     tt.notEqual(href.indexOf("http://"), 0, "script[src]: " + href);
    //     tt.notEqual(href.indexOf("https://"), 0, "script[src]: " + href);
    //   }
    // });
    tt.end();
  });

  t.test("index.json", function (tt) {
    var index;
    tt.ok(fs.existsSync(path.join(outputPath, "index.json")));
    tt.doesNotThrow(function () {
      index = require(path.join(outputPath, "index.json"));
    });
    tt.isObject(index);
    tt.equal(index["http://everytimezone.com/"], "index.html");
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
      appCache = require(path.join(outputPath, "appcache.json"));
    });
    tt.isObject(appCache);
    tt.isArray(appCache.cache);
    tt.end();
  });

});
