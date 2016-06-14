'use strict';

// 3rd-party modules

var cheerio = require('cheerio');

// local modules

var streamify = require('../utils.js').streamify;

// this module

/*
interface StringTransformOptions {
  contents: String,
  fetcher: Fetcher,
  filePath: String,
  index: FetcherIndex
}
*/
// transform (opts: StringTransformOptions) => String
function transform (opts) {
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
}

function htmlLocalLinkHrefs (opts) {
  return streamify(opts, transform);
}

module.exports = htmlLocalLinkHrefs;
module.exports.transform = transform;
