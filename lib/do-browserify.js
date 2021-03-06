'use strict';

// Node.js built-ins

var fs = require('graceful-fs');

// 3rd-party modules

var browserify = require('browserify');

// this module

/**
 * @param {String} addPath to be passed to `browserify#add()`
 * @param {String} outputPath to be passed to `fs.createWriteStream()`
 * @param {Object} options to be passed to `browserify()`
 * @returns {Promise} resolved when WriteStream "finish"es
 */
module.exports = function (addPath, outputPath, options) {
  return new Promise(function (resolve, reject) {
    var reader, writer;
    var b = browserify(options);

    b.add(addPath);
    reader = b.bundle()
    .on('error', function (err) {
      reject(err);
    });

    writer = fs.createWriteStream(outputPath)
    .on('finish', function () {
      resolve();
    })
    .on('error', function (err) {
      reject(err);
    });

    reader.pipe(writer);
  });
};
