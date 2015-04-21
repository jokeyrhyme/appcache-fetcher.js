/*eslint-env browser, node*/

"use strict";

// our modules

var FetcherIndex = require("./fetcher-index");

// this module

var appCacheIndex = process.browser ? window.appCacheIndex : {};

var fetcherIndex = new FetcherIndex({ index: appCacheIndex });

var oldLoad;

if (typeof window.require === "function" && typeof window.require.load === "function") {
  oldLoad = window.require.load;

  window.require.load = function (context, moduleId, moduleUrl) {
    var localUrl = fetcherIndex.resolveLocalUrl(moduleUrl);
    oldLoad.call(window.require, context, moduleId, localUrl);
  };
}
