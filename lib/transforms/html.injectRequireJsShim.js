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

function findLastRequireScript ($) {
  return $('script[src], script[data-appcache-src]').filter(function () {
    var src = utils.stripGZ($(this).attr('data-appcache-src') || $(this).attr('src'));
    var parsed = url.parse(src, false, true);
    return REQUIRE_BASE.indexOf(path.basename(parsed.pathname)) !== -1;
  }).last();
}

function findLastScript ($) {
  var script$ = findLastRequireScript($);
  if (script$.length) {
    return script$;
  }
  script$ = $('script').last();
  if (script$.length) {
    return script$;
  }
  return null;
}

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
  var filePath = opts.filePath;
  var lastScript$;

  var $ = cheerio.load(contents);
  if (path.basename(filePath) === 'index.html') {
    lastScript$ = findLastScript($);
    if (lastScript$) {
      lastScript$.after('<script src="require.load.js"></script>');
    } else {
      $('body').append('<script src="require.load.js"></script>');
    }
  }
  return $.html();
}

function htmlInjectRequireJsShim (opts) {
  return utils.streamify(opts, transform);
}

module.exports = htmlInjectRequireJsShim;
module.exports.transform = transform;
