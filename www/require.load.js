/* eslint-env browser, node */

'use strict';

// our modules

var FetcherIndex = require('./fetcher-index');

// this module

var appCacheIndex = global.appCacheIndex || {};

var fetcherIndex = new FetcherIndex({ index: appCacheIndex });

var isAMD = typeof global.define === 'function' && typeof global.define.amd !== 'undefined';

var isRequireJS = isAMD && typeof global.require === 'function' && typeof global.require.load === 'function';

(function () {
  var oldLoad;

  if (isRequireJS) {
    oldLoad = global.require.load;

    global.require.load = function (context, moduleId, moduleUrl) {
      var localUrl = fetcherIndex.resolveLocalUrl(moduleUrl);
      oldLoad.call(global.require, context, moduleId, localUrl);
    };
  }
}());

(function (fn) {
  if (isAMD) {
    global.require(['jquery'], fn);
  } else {
    fn(global.$);
  }
}(function ($) {
  require('./shims/jquery.ajax')(fetcherIndex, $, 'ajax');
  require('./shims/jquery.html')(fetcherIndex, $.fn, 'html');
}));
