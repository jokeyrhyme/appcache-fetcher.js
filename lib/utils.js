'use strict';

// Node.js built-in

var path = require('path');

// this module

module.exports = {

  /**
  @param {String} urlString to remove things like ".gz"
  @returns {String} without ".gz" in it
  */
  stripGZ: function (urlString) {
    var basename = path.basename(urlString);
    return path.dirname(urlString) + '/' + basename.replace(/\.gz\b/g, '');
  }

};
