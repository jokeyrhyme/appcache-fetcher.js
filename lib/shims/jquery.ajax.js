"use strict";

/**
 * @param {FetcherIndex} index to use for URL resolution
 * @param {Object} context e.g. jQuery, $, etc
 * @param {String} method name e.g. "ajax"
 * @returns {Function} the shim
 */
module.exports = function (index, context, method) {
  var oldMethod = context[method];

  var fixString = function (value) {
    if (value && typeof value === "string") {
      return index.resolveLocalUrl(value);
    }
    return value;
  };
  var fixObject = function (value) {
    if (value && typeof value === "object" && value.hasOwnProperty("url")) {
      value.url = fixString(value.url);
    }
    return value;
  };

  context[method] = function (a, b) {
    var args;
    if (!arguments.length) {
      return oldMethod.call(context);
    }
    args = [ fixObject(fixString(a)) ];
    if (typeof b !== "undefined") {
      args.push(fixObject(fixString(b)));
    }
    return oldMethod.apply(context, args);
  };

  return context[method];

};
