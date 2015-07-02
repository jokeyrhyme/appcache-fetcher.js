'use strict';

// 3rd-party modules

var cheerio = require('cheerio');

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var index = opts.index;

  var $ = cheerio.load(contents);
  $('script[src]').each(function () {
    var el$ = $(this);
    var href = el$.attr('src');
    var newHref = index.resolveLocalUrl(href);
    if (href && href !== newHref) {
      el$.attr({
        'data-appcache-src': href,
        src: newHref
      });
    }
  });
  return $.html();
};
