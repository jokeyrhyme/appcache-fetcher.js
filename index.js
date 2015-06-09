'use strict';

// Node.js built-ins

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var url = require('url');

// 3rd-party modules

var AppCache = require('@jokeyrhyme/appcache');

var browserify = require('browserify');
var mkdirp = require('mkdirp');
var request = require('request');
var temp = require('temp').track();

// our modules

var FetcherIndex = require('./lib/fetcher-index');

var urlVars = require('./lib/url_variations');

// this module

/**
 * @constructor
 * @param {Object} opts { remoteUrl: '', localPath: '' }
 */
function Fetcher(opts) {
  this.date = new Date();
  this.remoteUrl = opts.remoteUrl;
  this.localPath = opts.localPath;
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

  this.addExtractor('manifestUrl', require('./lib/extractors/manifestUrl.w3c'));

  this.addTransform('css', require('./lib/transforms/css.localUrls'));
  this.addTransform('html', require('./lib/transforms/html.removeManifest'));
  this.addTransform('html', require('./lib/transforms/html.localLinkHrefs'));
  this.addTransform('html', require('./lib/transforms/html.localScriptSrcs'));
  this.addTransform('html', require('./lib/transforms/html.injectAppCacheIndex'));
  this.addTransform('html', require('./lib/transforms/html.injectRequireJsShim'));
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
  var me = this;
  var filePath = path.join(this.localPath, 'appCacheIndex.js');

  return new Promise(function (resolve, reject) {
    var b = browserify({
      paths: [ me.localPath ],
      standalone: 'appCacheIndex'
    });
    b.add(path.join(__dirname, 'lib', 'app-cache-index.js'));
    b.bundle()
    .on('end', function () {
      resolve();
    })
    .on('error', function (err) {
      reject(err);
    })
    .pipe(fs.createWriteStream(filePath));
  });
};

Fetcher.prototype.generateRequireShim = function () {
  var filePath = path.join(this.localPath, 'require.load.js');

  return new Promise(function (resolve, reject) {
    var b = browserify();
    b.add(path.join(__dirname, 'lib', 'require.load.js'));
    b.bundle()
    .on('end', function () {
      resolve();
    })
    .on('error', function (err) {
      reject(err);
    })
    .pipe(fs.createWriteStream(filePath));
  });
};

Fetcher.prototype.download = function (remoteUrl, localPath) {
  var me = this;
  var filePath;
  var filename;

  if (Array.isArray(remoteUrl)) {
    return Promise.all(remoteUrl.map(function (r) {
      return me.download(r, localPath);
    }));
  }

  console.log('download:', remoteUrl);

  filename = me.generateLocalFilePath(remoteUrl);
  filePath = path.join(localPath, filename);

  return new Promise(function (resolve, reject) {
    request(remoteUrl)
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
    })
    .on('end', function () {
      resolve();
    })
    .pipe(fs.createWriteStream(filePath));
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
    return me.readFile(path.join(me.localPath, 'appcache.manifest'));
  })
  .then(function (contents) {
    var appCache = AppCache.parse(contents);
    return me.writeFile(
      path.join(me.localPath, 'appcache.json'),
      JSON.stringify(appCache, null, 2)
    );
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
  });
};

Fetcher.getURLVariationsOnQuery = urlVars.getURLVariationsOnQuery;
Fetcher.getURLVariationsOnScheme = urlVars.getURLVariationsOnScheme;
Fetcher.getURLVariations = urlVars.getURLVariations;

module.exports = Fetcher;
