'use strict';

// Node.js built-ins

var url = require('url');

// 3rd-party modules

var uniq = require('lodash.uniq');

// this module

exports.getURLVariationsOnQuery = function (input, isSub) {
  var parsed = url.parse(input, true, true);
  var output = [];
  var oldQuery = parsed.query;
  output.push(input);
  delete parsed.search;
  Object.keys(oldQuery).forEach(function (key) {
    var newQuery = JSON.parse(JSON.stringify(oldQuery));
    var subVariations;
    delete newQuery[key];
    parsed.query = newQuery;
    if (Object.keys(newQuery).length) {
      subVariations = exports.getURLVariationsOnQuery(url.format(parsed), true);
      output.push.apply(output, subVariations);
    }
  });
  if (!isSub) { // only runs for the outer-most call
    delete parsed.query;
    output.push(url.format(parsed));
  }
  return uniq(output);
};

exports.getURLVariationsOnScheme = function (input) {
  var parsed = url.parse(input, false, true);
  var output = [];
  parsed.protocol = 'https';
  output.push(url.format(parsed));
  parsed.protocol = 'http';
  output.push(url.format(parsed));
  return output;
};

exports.getURLVariations = function (input) {
  // disable this for now
  // var output = [];
  // exports.getURLVariationsOnQuery(input).forEach(function (variation) {
  //   output.push.apply(output, exports.getURLVariationsOnScheme(variation));
  // });
  return exports.getURLVariationsOnScheme(input);
  // return output;
};

module.exports = exports;
