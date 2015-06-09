'use strict';

// Node.js built-ins

var url = require('url');

// 3rd-party modules

var cheerio = require('cheerio');

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var remoteUrl = opts.remoteUrl;

  var $ = cheerio.load(contents);
  var html$ = $('html');
  var manifestUrl = html$.attr('manifest') || '';
  if (manifestUrl) {
    manifestUrl = url.resolve(remoteUrl, manifestUrl);
  }
  return manifestUrl;
};
