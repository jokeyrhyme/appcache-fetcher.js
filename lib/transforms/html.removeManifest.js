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

  var $ = cheerio.load(contents);
  $('html').removeAttr('manifest'); // drop AppCache manifest attributes
  return $.html();
}

function htmlRemoveManifest (opts) {
  return streamify(opts, transform);
}

module.exports = htmlRemoveManifest;
module.exports.transform = transform;
