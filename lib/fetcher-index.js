"use strict";

// Node.js built-ins

var url = require("url");

// our modules

var urlVars = require("./url_variations");

// this module

function FetcherIndex(opts) {
  this.remoteUrl = opts.remoteUrl || "";
  this.index = opts.index || {};
}

FetcherIndex.prototype.toJSON = function () {
  return this.index;
};

FetcherIndex.prototype.set = function (remoteUrl, localUrl) {
  this.index[remoteUrl] = localUrl;
};

FetcherIndex.prototype.resolveRemoteUrl = function (localUrl) {
  var me = this;
  var remoteUrl;
  Object.keys(this.index).forEach(function (key) {
    if (me.index[key] === localUrl) {
      remoteUrl = key;
    }
  });
  return remoteUrl || null;
};

FetcherIndex.prototype.resolveLocalUrl = function (remoteUrl) {
  var me = this;
  var absUrl;
  var localHref;
  var variations, v, vLength, variation;
  this.ensureRemoteUrl();
  absUrl = url.resolve(this.remoteUrl, remoteUrl);
  variations = urlVars.getURLVariations(absUrl);
  vLength = variations.length;
  for (v = 0; v < vLength; v++) {
    variation = variations[v];
    localHref = me.index[variation];
    if (localHref) {
      return localHref;
    }
  }
  return absUrl;
};

FetcherIndex.prototype.ensureRemoteUrl = function () {
  if (this.remoteUrl) {
    return; // nothing to do
  }
  this.remoteUrl = this.resolveRemoteUrl("index.html");
};

module.exports = FetcherIndex;
