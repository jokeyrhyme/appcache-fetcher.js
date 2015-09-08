/* eslint-disable no-console */

'use strict';

// Node.js built-ins

var crypto = require('crypto');
var fs = require('graceful-fs');
var path = require('path');
var url = require('url');

// 3rd-party modules

var AppCache = require('@jokeyrhyme/appcache');

var mkdirp = require('mkdirp');
var request = require('request');
var temp = require('temp').track();

// our modules

var FetcherIndex = require(path.join(__dirname, 'www', 'fetcher-index'));

var doBrowserify = require(path.join(__dirname, 'lib', 'do-browserify'));
var urlVars = require(path.join(__dirname, 'www', 'url_variations'));
var utils = require(path.join(__dirname, 'lib', 'utils'));
var values = require(path.join(__dirname, 'lib', 'values'));

// this module

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
  var me = this;

  return new Promise(function (resolve, reject) {
    temp.mkdir('appcache-fetcher-' + me.date.valueOf(), function (err, dirPath) {
      if (err) {
        reject(err);
        return;
      }
      me.tempPath = dirPath;
      resolve(dirPath);
    });
  });
};

Fetcher.prototype.afterLocalPath = function () {
  var me = this;

  return new Promise(function (resolve, reject) {
    mkdirp(me.localPath, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(me.localPath);
    });
  });
};

Fetcher.prototype.readFile = function (filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, contents) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(contents);
    });
  });
};

Fetcher.prototype.writeFile = function (filePath, contents) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, contents, function (err) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve();
    });
  });
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

Fetcher.prototype.download = function (remoteUrl, localPath) {
  var me = this;
  var filePath;
  var filename;
  var parsedRemoteUrl;

  if (Array.isArray(remoteUrl)) {
    return Promise.all(remoteUrl.map(function (r) {
      return me.download(r, localPath);
    }));
  }

  console.log('download:', remoteUrl);

  parsedRemoteUrl = url.parse(remoteUrl, true, true);
  if (values.FETCH_PROTOCOLS.indexOf(parsedRemoteUrl.protocol) === -1) {
    return Promise.reject(new Error('cannot download ' + remoteUrl));
  }

  filename = me.generateLocalFilePath(remoteUrl);
  filePath = path.join(localPath, filename);

  return new Promise(function (resolve, reject) {
    var reader, writer;

    reader = request(remoteUrl)
    .on('error', function (err) {
      console.error(err);
      reject(err);
    })
    .on('response', function (res) {
      var errorMsg;
      if (res.statusCode !== 200) {
        errorMsg = remoteUrl + ' : ' + res.statusCode;
        console.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      me.index.set(remoteUrl, filename);
    });

    writer = fs.createWriteStream(filePath)
    .on('error', function (err) {
      console.error(err);
      reject(err);
    })
    .on('finish', function () {
      resolve();
    });

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
  var me = this;
  var filePath = path.join(this.localPath, 'index.html');
  var extractors = this.extractors.manifestUrl;

  if (!Array.isArray(extractors) || !extractors.length) {
    return Promise.reject(new Error('no manifestUrl extractors'));
  }

  return me.readFile(filePath)
  .then(function (contents) {
    var manifestUrl;
    var e, eLength, extractor;
    eLength = extractors.length;
    for (e = 0; e < eLength; e++) {
      extractor = extractors[e];
      manifestUrl = extractor({
        contents: contents,
        remoteUrl: me.remoteUrl
      });
      if (manifestUrl) {
        return Promise.resolve(manifestUrl);
      }
    }
    return Promise.resolve('');
  });
};

Fetcher.prototype.saveAppCacheAsJSON = function (input) {
  var promise;

  if (input) {
    promise = Promise.resolve(input);
  } else {
    promise = this.readFile(path.join(this.localPath, 'appcache.manifest'));
  }

  return promise.then(function (contents) {
    var appCache = AppCache.parse(contents);
    appCache.cache = appCache.cache.filter(utils.filterUnfetchables);
    return this.writeFile(
      path.join(this.localPath, 'appcache.json'),
      JSON.stringify(appCache, null, 2)
    );
  }.bind(this));
};

Fetcher.prototype.downloadAppCacheEntries = function () {
  var me = this;
  var appCache;
  var remoteUrls;

  delete require.cache[path.join(me.localPath, 'appcache.json')];
  appCache = require(path.join(me.localPath, 'appcache.json'));

  remoteUrls = appCache.cache.map(function (entry) {
    return url.resolve(me.remoteUrl, entry.replace(/^\/\//, 'https://'));
  });

  return this.download(remoteUrls, me.localPath);
};

Fetcher.prototype.postProcessFile = function (filePath) {
  var me = this;
  var ext = path.extname(filePath).toLowerCase().replace('.', '');
  var transforms = me.transforms[ext];
  if (!Array.isArray(transforms) || !transforms.length) {
    return Promise.resolve();
  }
  console.log('postProcessFile:', filePath.replace(process.cwd(), ''));
  return this.readFile(filePath)
  .then(function (contents) {
    var transformedContents = contents;
    var t, tLength, transform;
    tLength = transforms.length;
    for (t = 0; t < tLength; t++) {
      transform = transforms[t];
      transformedContents = transform({
        contents: transformedContents,
        filePath: filePath,
        index: me.index
      });
    }
    return Promise.resolve(transformedContents);
  })
  .then(function (contents) {
    return me.writeFile(filePath, contents);
  });
};

Fetcher.prototype.postProcessDownloads = function () {
  var me = this;

  return new Promise(function (resolve, reject) {
    fs.readdir(me.localPath, function (err, files) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      Promise.all(files.map(function (file) {
        return me.postProcessFile(path.join(me.localPath, file));
      })).then(resolve, reject);
    });
  });
};

Fetcher.prototype.go = function () {
  var me = this;

  return Promise.all([
    this.afterTempPath(),
    this.afterLocalPath()
  ])
  .then(function () {
    return me.download(me.remoteUrl, me.localPath);
  })
  .then(function () {
    return me.getManifestURL();
  })
  .then(function (manifestUrl) {
    me.manifestUrl = manifestUrl;
    return me.download(me.manifestUrl, me.localPath);
  })
  .then(function () {
    return me.saveAppCacheAsJSON();
  })
  .then(function () {
    return me.downloadAppCacheEntries();
  })
  .then(function () {
    return me.persistFilesIndex();
  })
  .then(function () {
    return me.postProcessDownloads();
  })
  .then(function () {
    return Promise.all([
      me.generateAppCacheIndexShim(),
      me.generateRequireShim()
    ]);
  })
  .then(null, function (err) {
    console.error(err);
    return Promise.reject(err);
  });
};

Fetcher.getURLVariationsOnQuery = urlVars.getURLVariationsOnQuery;
Fetcher.getURLVariationsOnScheme = urlVars.getURLVariationsOnScheme;
Fetcher.getURLVariations = urlVars.getURLVariations;

module.exports = Fetcher;
