/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// Node.js built-ins

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

require("./01_everytimezone");
