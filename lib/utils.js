'use strict';

// Node.js built-in

var url = require('url');

// foreign modules

var isPromise = require('is-promise');
var through2 = require('through2');

// local modules

var values = require('./values');

// this module

// pipeTransforms (stream: Readable, transforms: Transforms[]) => Readable
function pipeTransforms (stream, transforms) {
  var head, rest;
  if (!Array.isArray(transforms) || !transforms.length) {
    return stream;
  }
  head = transforms[0];
  rest = transforms.slice(1);
  // recursively pipe to remaining Transforms
  return pipeTransforms(stream.pipe(head), rest);
}

// streamify ({ index: FetcherIndex }, transform: Function) => Stream
function streamify (opts, transform) {
  return through2.obj(
    // (vfile: VinylFile, enc: String, cb: Function)
    (vfile, enc, cb) => {
      var contents = vfile.contents.toString(enc);
      var result;
      var onSuccess = (contents) => {
        vfile.contents = new Buffer(contents, enc); // eslint-disable-line node/no-deprecated-api
        // TODO: drop Node.js 4.x support, use `Buffer.from()` instead
        cb(null, vfile);
      };
      var onError = (err) => {
        cb(err);
      };
      try {
        result = transform({
          contents: contents,
          fetcher: opts.fetcher,
          filePath: vfile.path,
          index: opts.index
        });
      } catch (err) {
        onError(err);
        return;
      }
      if (isPromise(result)) {
        result
          .then(onSuccess)
          .catch(onError);
        return;
      }
      onSuccess(result);
    }
  );
}

module.exports = {

  pipeTransforms,

  /**
  @param {String} urlString to remove things like ".gz"
  @returns {String} without ".gz" in it
  */
  stripGZ: function (urlString) {
    var parsed, segments, basename;
    if (!urlString || typeof urlString !== 'string') {
      return '';
    }
    parsed = url.parse(urlString, false, true);
    if (!parsed.pathname || parsed.pathname === '/') {
      return urlString;
    }
    segments = parsed.pathname.split('/');
    basename = segments.pop();
    basename = basename.replace(/\.gz\b/g, '');
    segments.push(basename);
    parsed.pathname = segments.join('/');
    return url.format(parsed);
  },

  streamify,

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
