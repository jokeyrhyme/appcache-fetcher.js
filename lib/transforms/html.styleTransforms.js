'use strict';

// Node.js built-ins

var stream = require('stream');

// 3rd-party modules

var cheerio = require('cheerio');
var VFile = require('vinyl');

// local modules

var utils = require('../utils.js');

// this module

// fileToReadable (file: VFile) => stream.Readable
function fileToReadable (file) {
  class VFileReadable extends stream.Readable {
    _read () {
      this.push(file);
      this.push(null);
    }
  }
  return new VFileReadable({ objectMode: true });
}

/**
interface TransformDOMTextOptions {
  filePath: String,
  getText: (el$: CheerioElement) => String,
  el$: CheerioElement,
  setText: (el$: CheerioElement, text: String) => Void
  transforms: stream.Transform[]
}
 */
// transformText(opts: TransformTextOptions) => Promise
function transformDOMText (opts) {
  return new Promise((resolve, reject) => {
    var file = new VFile({
      path: opts.filePath,
      contents: new Buffer(opts.getText(opts.el$), 'utf8')
    });
    var readable = fileToReadable(file);

    utils.pipeTransforms(readable, opts.transforms)
      .on('error', reject)
      .on('end', () => {
        opts.setText(opts.el$, file.contents.toString('utf8'));
        resolve();
      })
      .resume();
  });
}

// getAttrText (el$: CheerioElement) => String
function getAttrText (el$) {
  return el$.attr('style');
}

// setAttrText (el$: CheerioElement, text: String) => Void
function setAttrText (el$, text) {
  el$.attr('style', text);
}

// getTagText (el$: CheerioElement) => String
function getTagText (el$) {
  return el$.text();
}

// setTagText (el$: CheerioElement, text: String) => Void
function setTagText (el$, text) {
  el$.text(text);
}

/*
interface StringTransformOptions {
  contents: String,
  fetcher: Fetcher,
  filePath: String,
  index: FetcherIndex
}
*/
// transform (opts: StringTransformOptions) => String
function transform (opts) {
  var contents = opts.contents;

  var $ = cheerio.load(contents);

  var cssTransforms = opts.fetcher.transforms.css.map((tf) => tf({
    fetcher: opts.fetcher,
    index: opts.index
  }));

  // start parallel processing streams, one for each style tag
  var tasks = [].concat(
    // style attributes
    $('[style]').toArray().map((el) => transformDOMText({
      filePath: opts.filePath,
      getText: getAttrText, // get from attribute
      el$: $(el),
      setText: setAttrText, // set attribute
      transforms: cssTransforms
    })),
    // style tags
    $('style').toArray().map((el) => transformDOMText({
      filePath: opts.filePath,
      getText: getTagText, // get from textContent
      el$: $(el),
      setText: setTagText, // set textContent
      transforms: cssTransforms
    }))
  );
  return Promise.all(tasks)
    // all styles have been processed, output correct HTML
    .then(() => $.html());
}

function htmlStyleTransforms (opts) {
  return utils.streamify(opts, transform);
}

module.exports = htmlStyleTransforms;
module.exports.transform = transform;
