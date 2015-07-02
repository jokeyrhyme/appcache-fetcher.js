'use strict';

// 3rd-party modules

var cheerio = require('cheerio');

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var index = opts.index;

  var $ = cheerio.load(contents);
  $('link[href]').each(function () {
    var el$ = $(this);
    var href = el$.attr('href');
    var newHref = index.resolveLocalUrl(href);
    if (href && href !== newHref) {
      el$.attr({
        'data-appcache-href': href,
        href: newHref
      });
    }
  });
  return $.html();
};
