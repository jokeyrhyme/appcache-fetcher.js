'use strict';

// Node.js built-ins

var path = require('path');
var url = require('url');

// foreign modules

var cheerio = require('cheerio');

// local modules

var utils = require(path.join(__dirname, '..', 'utils'));

// this module

var REQUIRE_BASE = ['require.js', 'require.min.js'];

module.exports = function (opts) {
  var contents = opts.contents;

  var $ = cheerio.load(contents);
  var js$ = $('script[src]');

  js$ = js$.filter(function () {
    var src = $(this).attr('src');
    var parsed;
    parsed = url.parse(utils.stripGZ('' + src), null, true);
    return REQUIRE_BASE.indexOf(path.basename(parsed.pathname)) !== -1;
  });

  return js$.map(function () {
    return $(this).attr('src');
  }).get();
};
