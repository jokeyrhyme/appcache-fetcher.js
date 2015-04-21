/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// Node.js built-ins

var fs = require("fs");
var path = require("path");

// this module

module.exports = {

  makeAppCacheTests: function (outputPath) {
    return function (t) {
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

      t.end();
    };
  },

  makeCSSTests: function (outputPath) {
    return function (tt) {
      var files = fs.readdirSync(outputPath);
      files = files.filter(function (filename) {
        return path.extname(filename) === ".css";
      });

      files.forEach(function (filename) {
        var filePath = path.join(outputPath, filename);

        tt.test(filename, function (ttt) {
          var contents = fs.readFileSync(filePath, { encoding: "utf8" });
          var matches = contents.match(/url\(['"\s]*[^\(\)]+['"\s]*\)/g);
          if (Array.isArray(matches)) {
            matches.forEach(function (cssUrlStmt) {
              var cssUrl = cssUrlStmt.replace(/url\(['"\s]*([^\(\)]+)['"\s]*\)/, "$1");
              if (cssUrl.indexOf("data:") === 0) {
                return; // don't bother with Data URIs
              }
              console.log(cssUrl);
              ttt.notEqual(cssUrl.indexOf("//"), 0, cssUrl + " not protocol-relative");
              ttt.notEqual(cssUrl.indexOf("http://"), 0, cssUrl + " not remote HTTP");
              ttt.notEqual(cssUrl.indexOf("https://"), 0, cssUrl + " not remote HTTPS");
              ttt.ok(fs.existsSync(path.join(outputPath, cssUrl)), cssUrl + " local exists");
            });
          }
          ttt.end();
        });

      });

      tt.end();
    };
  }

};
