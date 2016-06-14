'use strict';

// Node.js built-ins

var path = require('path');

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
  var filePath = opts.filePath;

  var $ = cheerio.load(contents);
  if (path.basename(filePath) === 'index.html') {
    $('script').first().before('<script src="appCacheIndex.js"></script>');
  }
  return $.html();
}

function htmlInjectAppCacheIndex (opts) {
  return streamify(opts, transform);
}

module.exports = htmlInjectAppCacheIndex;
module.exports.transform = transform;
