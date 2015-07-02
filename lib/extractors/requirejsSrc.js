'use strict';

// Node.js built-ins

var path = require('path');

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
    src = utils.stripGZ(src || '');
    return REQUIRE_BASE.indexOf(path.basename(src)) !== -1;
  });

  return js$.map(function () {
    return $(this).attr('src');
  }).get();
};
