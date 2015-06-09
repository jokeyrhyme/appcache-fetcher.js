'use strict';

// Node.js built-ins

var path = require('path');
var url = require('url');

// this module

module.exports = function (opts) {
  var contents = opts.contents;
  var filePath = opts.filePath;
  var index = opts.index;

  // original remote URL for the given CSS file
  var cssRemoteUrl = index.resolveRemoteUrl(path.basename(filePath));

  return contents.replace(/url\([''\s]*[^\(\)]+[''\s]*\)/g, function (cssUrlStmt) {
    var cssUrl = cssUrlStmt.replace(/url\([''\s]*([^\(\)]+)[''\s]*\)/, '$1');
    var remoteUrl;
    var localUrl;
    if (cssUrl.indexOf('data:') === 0) {
      return cssUrlStmt; // noop for Data URIs
    }
    remoteUrl = url.resolve(cssRemoteUrl, cssUrl);
    localUrl = index.resolveLocalUrl(remoteUrl);
    return 'url(' + localUrl + ')';
  });
};
