"use strict";

// 3rd-party modules

var cheerio = require("cheerio");

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var index = opts.index;

  var $ = cheerio.load(contents);
  $("link[href]").each(function () {
    var el$ = $(this);
    var href = el$.attr("href");
    if (href) {
      el$.attr("href", index.resolveLocalUrl(href));
    }
  });
  return $.html();
};
