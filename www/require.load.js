/*eslint-env browser, node*/

'use strict';

// Node.js built-ins

var path = require('path');

// our modules

var FetcherIndex = require(path.join(__dirname, 'fetcher-index'));

// this module

var appCacheIndex = process.browser ? window.appCacheIndex : {};

var fetcherIndex = new FetcherIndex({ index: appCacheIndex });

var isAMD = typeof window.define === 'function' && typeof window.define.amd !== 'undefined';

var isRequireJS = isAMD && typeof window.require === 'function' && typeof window.require.load === 'function';

(function () {
  var oldLoad;

  if (isRequireJS) {
    oldLoad = window.require.load;

    window.require.load = function (context, moduleId, moduleUrl) {
      var localUrl = fetcherIndex.resolveLocalUrl(moduleUrl);
      oldLoad.call(window.require, context, moduleId, localUrl);
    };
  }
}());

(function (fn) {
  if (isAMD) {
    window.require(['jquery'], fn);
  } else {
    fn(window.$);
  }
}(function ($) {

  require(path.join(__dirname, 'shims', 'jquery.ajax'))(fetcherIndex, $, 'ajax');

}));
