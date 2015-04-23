"use strict";

// 3rd-party modules

var cheerio = require("cheerio");

// this module

module.exports = function (opts) {
  var contents = opts.contents;

  var $ = cheerio.load(contents);
  $("html").removeAttr("manifest"); // drop AppCache manifest attributes
  return $.html();
};
