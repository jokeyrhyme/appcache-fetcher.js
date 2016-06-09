'use strict';

// Node.js built-in

var path = require('path');
var url = require('url');

// local modules

var values = require('./values');

// this module

module.exports = {

  /**
  @param {String} urlString to remove things like ".gz"
  @returns {String} without ".gz" in it
  */
  stripGZ: function (urlString) {
    var basename;
    if (!urlString || typeof urlString !== 'string') {
      return '';
    }
    basename = path.basename(urlString);
    return path.dirname(urlString) + '/' + basename.replace(/\.gz\b/g, '');
  },

  /**
  intended to be used with `Array#filter()`
  @param {string} entry from AppCache manifest
  @returns {boolean} include entry?
  */
  filterUnfetchables: function (entry) {
    var parsed = url.parse(entry, true, true);
    return !parsed.protocol || values.FETCH_PROTOCOLS.indexOf(parsed.protocol) !== -1;
  }

};
