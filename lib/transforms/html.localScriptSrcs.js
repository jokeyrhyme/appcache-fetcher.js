'use strict';

// 3rd-party modules

var cheerio = require('cheerio');

// local modules

var streamify = require('../utils.js').streamify;

// this module

/*
interface StringTransformOptions {
  contents: String,
  filePath: String,
  index: FetcherIndex
}
*/
// transform (opts: StringTransformOptions) => String
function transform (opts) {
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
}

function htmlLocalScriptSrcs (opts) {
  return streamify(opts, transform);
}

module.exports = htmlLocalScriptSrcs;
module.exports.transform = transform;
