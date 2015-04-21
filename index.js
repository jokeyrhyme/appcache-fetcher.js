"use strict";

// Node.js built-ins

var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var url = require("url");

// 3rd-party modules

var AppCache = require("appcache");

var cheerio = require("cheerio");
var mkdirp = require("mkdirp");
var request = require("request");
var temp = require("temp").track();

// our modules

var urlVars = require("./lib/url_variations");

// this module

/**
 * @constructor
 * @param {Object} opts { remoteUrl: "", localPath: "" }
 */
function Fetcher(opts) {
  this.date = new Date();
  this.remoteUrl = opts.remoteUrl;
  this.localPath = opts.localPath;
  this.tempPath = "";
  this.index = {};
  this.manifestUrl = "";
}

Fetcher.prototype.afterTempPath = function () {
  var me = this;

  return new Promise(function (resolve, reject) {
    temp.mkdir("appcache-fetcher-" + me.date.valueOf(), function (err, dirPath) {
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
    fs.readFile(filePath, { encoding: "utf8" }, function (err, contents) {
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

Fetcher.prototype.download = function (remoteUrl, localPath) {
  var me = this;
  var filePath;
  var filename;

  if (Array.isArray(remoteUrl)) {
    return Promise.all(remoteUrl.map(function (r) {
      return me.download(r, localPath);
    }));
  }

  console.log("download:", remoteUrl);

  filename = me.generateLocalFilePath(remoteUrl);
  filePath = path.join(localPath, filename);

  return new Promise(function (resolve, reject) {
    request(remoteUrl)
    .on("error", function (err) {
      console.error(err);
      reject(err);
    })
    .on("response", function (res) {
      var errorMsg;
      if (res.statusCode !== 200) {
        errorMsg = remoteUrl + " : " + res.statusCode;
        console.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      me.index[remoteUrl] = filename;
    })
    .on("end", function () {
      resolve();
    })
    .pipe(fs.createWriteStream(filePath));
  });
};

Fetcher.prototype.generateLocalFilePath = function (remoteUrl) {
  var parsed;
  var hash;
  if (remoteUrl === this.remoteUrl) {
    return "index.html";
  }
  if (remoteUrl === this.manifestUrl) {
    return "appcache.manifest";
  }
  parsed = url.parse(remoteUrl, true, true);
  hash = crypto.createHash("sha1");
  hash.update(parsed.pathname + parsed.search);
  return hash.digest("hex") + path.extname(parsed.pathname);
};

Fetcher.prototype.persistFilesIndex = function () {
  var content = JSON.stringify(this.index, null, 2);
  var filePath = path.join(this.localPath, "index.json");

  return this.writeFile(filePath, content);
};

Fetcher.prototype.getManifestURL = function () {
  var me = this;
  var filePath = path.join(this.localPath, "index.html");

  return me.readFile(filePath)
  .then(function (contents) {
    var $ = cheerio.load(contents);
    var html$ = $("html");
    var manifestUrl = html$.attr("manifest") || "";
    if (manifestUrl) {
      manifestUrl = url.resolve(me.remoteUrl, manifestUrl);
    }
    return Promise.resolve(manifestUrl);
  });
};

Fetcher.prototype.downloadAppCacheEntries = function () {
  var me = this;
  var appCache;
  var remoteUrls;

  delete require.cache[path.join(me.localPath, "appcache.json")];
  appCache = require(path.join(me.localPath, "appcache.json"));

  remoteUrls = appCache.cache.map(function (entry) {
    return url.resolve(me.remoteUrl, entry.replace(/^\/\//, "https://"));
  });

  return this.download(remoteUrls, me.localPath);
};

Fetcher.prototype.resolveRemoteUrl = function (localUrl) {
  var me = this;
  var remoteUrl;
  Object.keys(this.index).forEach(function (key) {
    if (me.index[key] === localUrl) {
      remoteUrl = key;
    }
  });
  return remoteUrl || null;
};

Fetcher.prototype.resolveLocalURL = function (remoteUrl) {
  var me = this;
  var absUrl;
  var localHref;
  var variations, v, vLength, variation;
  absUrl = url.resolve(this.remoteUrl, remoteUrl);
  variations = urlVars.getURLVariations(absUrl);
  vLength = variations.length;
  for (v = 0; v < vLength; v++) {
    variation = variations[v];
    localHref = me.index[variation];
    if (localHref) {
      return localHref;
    }
  }
  return absUrl;
};

Fetcher.EXTENSIONS_TO_PROCESS = [ ".css", ".html", ".js" ];

Fetcher.prototype.postProcessCSS = function (filePath) {
  var me = this;
  // original remote URL for the given CSS file
  var cssRemoteUrl = this.resolveRemoteUrl(path.basename(filePath));
  console.log("postProcessCSS:", path.basename(filePath), cssRemoteUrl);

  return this.readFile(filePath)
  .then(function (contents) {
    var css = contents.replace(/url\(['"\s]*[^\(\)]+['"\s]*\)/g, function (cssUrlStmt) {
      var cssUrl = cssUrlStmt.replace(/url\(['"\s]*([^\(\)]+)['"\s]*\)/, "$1");
      var remoteUrl;
      var localUrl;
      if (cssUrl.indexOf("data:") === 0) {
        return cssUrlStmt; // noop for Data URIs
      }
      remoteUrl = url.resolve(cssRemoteUrl, cssUrl);
      localUrl = me.resolveLocalURL(remoteUrl);
      return "url(" + localUrl + ")";
    });
    return Promise.resolve(css);
  })
  .then(function (contents) {
    return me.writeFile(filePath, contents);
  });
};

Fetcher.prototype.postProcessHTML = function (filePath) {
  var me = this;
  console.log("postProcessHTML:");
  return this.readFile(filePath)
  .then(function (contents) {
    var $ = cheerio.load(contents);
    $("html").removeAttr("manifest"); // drop AppCache manifest attributes
    $("link[href]").each(function () {
      var el$ = $(this);
      var href = el$.attr("href");
      if (href) {
        el$.attr("href", me.resolveLocalURL(href));
      }
    });
    $("script[src]").each(function () {
      var el$ = $(this);
      var href = el$.attr("src");
      if (href) {
        el$.attr("src", me.resolveLocalURL(href));
      }
    });
    return Promise.resolve($.html());
  })
  .then(function (contents) {
    return me.writeFile(filePath, contents);
  });
};

Fetcher.prototype.postProcessJS = function (filePath) {
  console.log("postProcessJS:");
  return this.readFile(filePath);
};

Fetcher.prototype.postProcessFile = function (filePath) {
  var me = this;
  var ext = path.extname(filePath);
  if (Fetcher.EXTENSIONS_TO_PROCESS.indexOf(ext) === -1) {
    console.log("postProcessFile: skipping", filePath.replace(process.cwd(), ""));
    return Promise.resolve();
  }
  return new Promise(function (resolve, reject) {
    console.log("postProcessFile:", filePath.replace(process.cwd(), ""));
    ext = ext.toUpperCase().replace(".", "");
    me["postProcess" + ext](filePath).then(resolve, reject);
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
    return me.readFile(path.join(me.localPath, "appcache.manifest"));
  })
  .then(function (contents) {
    var appCache = AppCache.parse(contents);
    return me.writeFile(
      path.join(me.localPath, "appcache.json"),
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
  });
};

Fetcher.getURLVariationsOnQuery = urlVars.getURLVariationsOnQuery;
Fetcher.getURLVariationsOnScheme = urlVars.getURLVariationsOnScheme;
Fetcher.getURLVariations = urlVars.getURLVariations;

module.exports = Fetcher;
