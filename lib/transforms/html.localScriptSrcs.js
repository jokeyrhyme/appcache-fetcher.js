"use strict";

// 3rd-party modules

var cheerio = require("cheerio");

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var index = opts.index;

  var $ = cheerio.load(contents);
  $("script[src]").each(function () {
    var el$ = $(this);
    var href = el$.attr("src");
    if (href) {
      el$.attr("src", index.resolveLocalUrl(href));
    }
  });
  return $.html();
};
