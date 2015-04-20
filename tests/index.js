/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// Node.js built-ins

var fs = require("fs");
var path = require("path");

// 3rd-party modules

var rimraf = require("rimraf");
var test = require("tape");

// our modules

var Fetcher = require("..");

// this module

var outputPath = path.join(process.cwd(), "output");

require("tape-chai");

rimraf.sync(outputPath);

test("Fetcher", function (t) {
  t.isFunction(Fetcher);
  t.end();
});

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
    tt.ok(fs.existsSync(path.join(outputPath, "index.html")));
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

});
