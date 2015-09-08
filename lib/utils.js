'use strict';

// Node.js built-in

var path = require('path');
var url = require('url');

// this module

var FETCH_PROTOCOLS = ['http:', 'https:', null];

module.exports = {

  /**
  @param {String} urlString to remove things like ".gz"
  @returns {String} without ".gz" in it
  */
  stripGZ: function (urlString) {
    var basename = path.basename(urlString);
    return path.dirname(urlString) + '/' + basename.replace(/\.gz\b/g, '');
  },

  /**
  intended to be used with `Array#filter()`
  @param {string} entry from AppCache manifest
  @returns {boolean} include entry?
  */
  filterUnfetchables: function (entry) {
    var parsed = url.parse(entry, true, true);
    return FETCH_PROTOCOLS.indexOf(parsed.protocol) !== -1;
  }

};
