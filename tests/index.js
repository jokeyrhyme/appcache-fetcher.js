/*eslint-disable no-sync*/ // tests can be synchronous, relax!

"use strict";

// 3rd-party modules

var test = require("tape");

// our modules

var Fetcher = require("..");

// this module

require("tape-chai");

test("Fetcher", function (t) {
  t.isFunction(Fetcher);
  t.end();
});

test("Fetcher.getURLVariations()", function (t) {

  t.test("https://domain.com/example", function (tt) {
    var variations = Fetcher.getURLVariationsOnScheme("https://domain.com/example");
    tt.deepEqual(variations, [
      "https://domain.com/example",
      "http://domain.com/example"
    ]);
    tt.end();
  });

  t.test("http://domain.com/example", function (tt) {
    var variations = Fetcher.getURLVariations("http://domain.com/example");
    tt.deepEqual(variations, [
      "https://domain.com/example",
      "http://domain.com/example"
    ]);
    tt.end();
  });

  t.test("https://domain.com/example", function (tt) {
    var variations = Fetcher.getURLVariationsOnScheme("https://domain.com/example");
    tt.deepEqual(variations, [
      "https://domain.com/example",
      "http://domain.com/example"
    ]);
    tt.end();
  });

  t.test("http://domain.com/example", function (tt) {
    var variations = Fetcher.getURLVariations("http://domain.com/example");
    tt.deepEqual(variations, [
      "https://domain.com/example",
      "http://domain.com/example"
    ]);
    tt.end();
  });

  t.test("http://domain.com/example?abc&def=ghi", function (tt) {
    var variations = Fetcher.getURLVariationsOnQuery("http://domain.com/example?abc&def=ghi");
    tt.deepEqual(variations, [
      "http://domain.com/example?abc&def=ghi",
      "http://domain.com/example?def=ghi",
      "http://domain.com/example?abc=",
      "http://domain.com/example"
    ]);
    tt.end();
  });

  t.test("http://domain.com/example?abc&def=ghi", function (tt) {
    var variations = Fetcher.getURLVariations("http://domain.com/example?abc&def=ghi");
    tt.deepEqual(variations, [
      "https://domain.com/example?abc&def=ghi",
      "http://domain.com/example?abc&def=ghi"
      // disable this for now
      // "https://domain.com/example?def=ghi",
      // "http://domain.com/example?def=ghi",
      // "https://domain.com/example?abc=",
      // "http://domain.com/example?abc=",
      // "https://domain.com/example",
      // "http://domain.com/example"
    ]);
    tt.end();
  });

  t.end();
});

require("./01_everytimezone");

require("./01_bicintegration");
