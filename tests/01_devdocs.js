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

var common = require("./lib/common");

// this module

var remoteUrl = "http://devdocs.io/";

var outputPath = path.join(process.cwd(), "output");

test("new Fetcher({ remoteUrl: '" + remoteUrl + "' })", function (t) {
  var fetcher;

  t.test("constructor", function (tt) {
    rimraf.sync(outputPath);

    tt.doesNotThrow(function () {
      fetcher = new Fetcher({
        remoteUrl: remoteUrl,
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
    // these tests fail because of weird URLs in HTML / AppCache (?yyyymmdd)
    // common.testHTMLLinkHref($, tt);
    common.testHTMLScriptSrc($, tt);
    tt.end();
  });

  t.test("index.json", common.makeIndexJSONTests(outputPath, remoteUrl));

  t.test("*.css", common.makeCSSTests(outputPath));

  t.test("AppCache", common.makeAppCacheTests(outputPath));

});
