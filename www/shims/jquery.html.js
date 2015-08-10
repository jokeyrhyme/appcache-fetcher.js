'use strict';

/**
 * @param {FetcherIndex} index to use for URL resolution
 * @param {Object} context e.g. jQuery, $, etc
 * @param {String} method name e.g. 'ajax'
 * @returns {Function} the shim
 */

//var cheerio = require('cheerio');

module.exports = function (index, context, method) {
  var oldMethod = context[method];

  var fixSrc = function (whole, value) {
    console.log('input whole is: '+ whole + ', value is: ' + value);
    var fixValue;
    if (value && typeof value === 'string') {
      fixValue = index.resolveLocalUrl(value);
      whole = whole.replace(value, fixValue);
    }
    console.log('fixed whole is: '+ whole + ', value is: ' + fixValue);
    return whole;
  };

  var fixHtml = function (value) {
    if (value && typeof value === 'string') {
      value = value.replace(/<img[-_\s\=\"\'\.\/\w]* src="([-_\.\/\w]+)"/gmi, fixSrc);
    }

    return value;
  };

  context[method] = function (htmlString) {
    var args;
    if (!arguments.length) {
      return oldMethod.call(this);
    }

    if (htmlString && typeof htmlString === 'string') {
      htmlString = fixHtml(htmlString);
    }
    return oldMethod.call(this, htmlString);
  };

  return context[method];

};
