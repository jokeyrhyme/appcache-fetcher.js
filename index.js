/* eslint-disable no-console */

'use strict';

// Node.js built-ins

var crypto = require('crypto');
var fs = require('graceful-fs');
var path = require('path');
var url = require('url');

// 3rd-party modules

var AppCache = require('@jokeyrhyme/appcache');
var chalk = require('chalk');
var mkdirp = require('mkdirp');
var pify = require('pify');
var request = require('request');
var temp = require('temp').track();

// our modules

var FetcherIndex = require(path.join(__dirname, 'www', 'fetcher-index'));

var doBrowserify = require(path.join(__dirname, 'lib', 'do-browserify'));
var urlVars = require(path.join(__dirname, 'www', 'url_variations'));
var utils = require(path.join(__dirname, 'lib', 'utils'));
var values = require(path.join(__dirname, 'lib', 'values'));

// this module

var fsp = pify(fs);
var mkdirpp = pify(mkdirp);

function logError (msg) {
  console.error(chalk.red(msg));
}

function logErrorAndThrow (err) {
  logError(err);
  throw err;
}

/**
 * @constructor
 * @param {Object} opts { remoteUrl: '', localPath: '' }
 */
function Fetcher (opts) {
  this.date = new Date();
  this.remoteUrl = opts.remoteUrl;
  this.localPath = path.resolve(opts.localPath);
  this.tempPath = '';
  this.index = new FetcherIndex({ remoteUrl: this.remoteUrl });
  this.manifestUrl = '';
  this.strictMode = typeof opts.strictMode === 'boolean' ? opts.strictMode : true;

  this.transforms = {
    css: [],
    html: [],
    js: []
  };
  this.extractors = {
    manifestUrl: []
  };

  this.addExtractor('manifestUrl', require(path.join(__dirname, 'lib', 'extractors', 'manifestUrl.w3c')));
  this.addExtractor('requirejsSrc', require(path.join(__dirname, 'lib', 'extractors', 'manifestUrl.w3c')));

  this.addTransform('css', require(path.join(__dirname, 'lib', 'transforms', 'css.localUrls')));
  this.addTransform('html', require(path.join(__dirname, 'lib', 'transforms', 'html.removeManifest')));
  this.addTransform('html', require(path.join(__dirname, 'lib', 'transforms', 'html.localLinkHrefs')));
  this.addTransform('html', require(path.join(__dirname, 'lib', 'transforms', 'html.localScriptSrcs')));
  this.addTransform('html', require(path.join(__dirname, 'lib', 'transforms', 'html.injectAppCacheIndex')));
  this.addTransform('html', require(path.join(__dirname, 'lib', 'transforms', 'html.injectRequireJsShim')));
}

Fetcher.prototype.addExtractor = function (prop, fn) {
  if (!Array.isArray(this.extractors[prop])) {
    this.extractors[prop] = [];
  }
  this.extractors[prop].push(fn);
};

Fetcher.prototype.addTransform = function (ext, fn) {
  if (!Array.isArray(this.transforms[ext])) {
    this.transforms[ext] = [];
  }
  this.transforms[ext].push(fn);
};

Fetcher.prototype.afterTempPath = function () {
  return new Promise((resolve, reject) => {
    temp.mkdir('appcache-fetcher-' + this.date.valueOf(), (err, dirPath) => {
      if (err) {
        reject(err);
        return;
      }
      this.tempPath = dirPath;
      resolve(dirPath);
    });
  });
};

Fetcher.prototype.afterLocalPath = function () {
  return mkdirpp(this.localPath)
    .then(() => this.localPath);
};

Fetcher.prototype.readFile = function (filePath) {
  return fsp.readFile(filePath, { encoding: 'utf8' })
    .catch(logErrorAndThrow);
};

Fetcher.prototype.writeFile = function (filePath, contents) {
  return fsp.writeFile(filePath, contents)
    .catch(logErrorAndThrow);
};

Fetcher.prototype.generateAppCacheIndexShim = function () {
  var addPath = path.join(__dirname, 'www', 'app-cache-index.js');
  var filePath = path.join(this.localPath, 'appCacheIndex.js');
  var options = {
    paths: [ this.localPath ],
    standalone: 'appCacheIndex'
  };

  return doBrowserify(addPath, filePath, options);
};

Fetcher.prototype.generateRequireShim = function () {
  var addPath = path.join(__dirname, 'www', 'require.load.js');
  var filePath = path.join(this.localPath, 'require.load.js');

  return doBrowserify(addPath, filePath, {});
};

function rejectIfStrict (me, err, resolve, reject) {
  logError(err);
  if (me.strictMode) {
    reject(err);
    return;
  }
  resolve();
}

Fetcher.prototype.download = function (remoteUrl, localPath) {
  var filePath;
  var filename;
  var parsedRemoteUrl;

  if (Array.isArray(remoteUrl)) {
    return Promise.all(remoteUrl.map((r) => {
      return this.download(r, localPath);
    }));
  }

  console.log('download:', remoteUrl);

  parsedRemoteUrl = url.parse(remoteUrl, true, true);
  if (values.FETCH_PROTOCOLS.indexOf(parsedRemoteUrl.protocol) === -1) {
    return new Promise((resolve, reject) => {
      rejectIfStrict(this, new Error('cannot download ' + remoteUrl), resolve, reject);
    });
  }

  filename = this.generateLocalFilePath(remoteUrl);
  filePath = path.join(localPath, filename);

  return new Promise((resolve, reject) => {
    var reader, writer;

    reader = request(remoteUrl)
    .on('error', (err) => {
      rejectIfStrict(this, err, resolve, reject);
    })
    .on('response', (res) => {
      if (res.statusCode !== 200) {
        rejectIfStrict(this, new Error(remoteUrl + ' : ' + res.statusCode), resolve, reject);
        return;
      }
      this.index.set(remoteUrl, filename);
    });

    writer = fs.createWriteStream(filePath)
    .on('error', (err) => {
      rejectIfStrict(this, err, resolve, reject);
    })
    .on('finish', () => resolve());

    reader.pipe(writer);
  });
};

Fetcher.prototype.generateLocalFilePath = function (remoteUrl) {
  var parsed;
  var hash;
  if (remoteUrl === this.remoteUrl) {
    return 'index.html';
  }
  if (remoteUrl === this.manifestUrl) {
    return 'appcache.manifest';
  }
  parsed = url.parse(remoteUrl, true, true);
  hash = crypto.createHash('sha1');
  hash.update(parsed.pathname + parsed.search);
  return hash.digest('hex') + path.extname(parsed.pathname);
};

Fetcher.prototype.persistFilesIndex = function () {
  var content = JSON.stringify(this.index, null, 2);
  var filePath = path.join(this.localPath, 'index.json');

  return this.writeFile(filePath, content);
};

Fetcher.prototype.getManifestURL = function () {
  var filePath = path.join(this.localPath, 'index.html');
  var extractors = this.extractors.manifestUrl;

  if (!Array.isArray(extractors) || !extractors.length) {
    return Promise.reject(new Error('no manifestUrl extractors'));
  }

  return this.readFile(filePath)
    .then((contents) => {
      var manifestUrl;
      var e, eLength, extractor;
      eLength = extractors.length;
      for (e = 0; e < eLength; e++) {
        extractor = extractors[e];
        manifestUrl = extractor({
          contents: contents,
          remoteUrl: this.remoteUrl
        });
        if (manifestUrl) {
          return manifestUrl;
        }
      }
      return '';
    });
};

Fetcher.prototype.saveAppCacheAsJSON = function (input) {
  var promise;

  if (input) {
    promise = Promise.resolve(input);
  } else {
    promise = this.readFile(path.join(this.localPath, 'appcache.manifest'));
  }

  return promise.then((contents) => {
    var appCache = AppCache.parse(contents);
    appCache.cache = appCache.cache.filter(utils.filterUnfetchables);
    return this.writeFile(
      path.join(this.localPath, 'appcache.json'),
      JSON.stringify(appCache, null, 2)
    );
  });
};

Fetcher.prototype.downloadAppCacheEntries = function () {
  var appCache;
  var remoteUrls;

  delete require.cache[path.join(this.localPath, 'appcache.json')];
  appCache = require(path.join(this.localPath, 'appcache.json'));

  remoteUrls = appCache.cache.map((entry) => {
    return url.resolve(this.remoteUrl, entry.replace(/^\/\//, 'https://'));
  });

  return this.download(remoteUrls, this.localPath);
};

Fetcher.prototype.postProcessFile = function (filePath) {
  var ext = path.extname(filePath).toLowerCase().replace('.', '');
  var transforms = this.transforms[ext];
  if (!Array.isArray(transforms) || !transforms.length) {
    return Promise.resolve();
  }
  console.log('postProcessFile:', filePath.replace(process.cwd(), ''));
  return this.readFile(filePath)
    .then((contents) => {
      var transformedContents = contents;
      var t, tLength, transform;
      tLength = transforms.length;
      for (t = 0; t < tLength; t++) {
        transform = transforms[t];
        transformedContents = transform({
          contents: transformedContents,
          filePath: filePath,
          index: this.index
        });
      }
      return transformedContents;
    })
    .then((contents) => {
      return this.writeFile(filePath, contents);
    });
};

Fetcher.prototype.postProcessDownloads = function () {
  return fsp.readdir(this.localPath)
    .catch(logErrorAndThrow)
    .then((files) => Promise.all(files.map((file) => {
      return this.postProcessFile(path.join(this.localPath, file));
    })));
};

Fetcher.prototype.go = function () {
  return Promise.all([
    this.afterTempPath(),
    this.afterLocalPath()
  ])
    .then(() => this.download(this.remoteUrl, this.localPath))
    .then(() => this.getManifestURL())
    .then((manifestUrl) => {
      this.manifestUrl = manifestUrl;
      return this.download(this.manifestUrl, this.localPath);
    })
    .then(() => this.saveAppCacheAsJSON())
    .then(() => this.downloadAppCacheEntries())
    .then(() => this.persistFilesIndex())
    .then(() => this.postProcessDownloads())
    .then(() => Promise.all([
      this.generateAppCacheIndexShim(),
      this.generateRequireShim()
    ]))
    .catch(logErrorAndThrow);
};

Fetcher.getURLVariationsOnQuery = urlVars.getURLVariationsOnQuery;
Fetcher.getURLVariationsOnScheme = urlVars.getURLVariationsOnScheme;
Fetcher.getURLVariations = urlVars.getURLVariations;

module.exports = Fetcher;
