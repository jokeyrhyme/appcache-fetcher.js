"use strict";

// Node.js built-ins

var EventEmitter = require("events").EventEmitter;

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
  this.files = {};
  this.manifestUrl = "";
}

Fetcher.prototype = Object.create(EventEmitter.prototype);
Fetcher.prototype.constructor = Fetcher;

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
  console.log("download: " + remoteUrl);

  return new Promise(function (resolve, reject) {
    request({ url: remoteUrl }, function (reqErr, res, body) {
      var filePath;
      var filename;
      if (reqErr) {
        console.error(reqErr);
        reject(reqErr);
        return;
      }
      if (res.statusCode !== 200) {
        console.error("http statusCode: " + res.statusCode);
        reject(new Error("http statusCode: " + res.statusCode));
        return;
      }
      filename = me.generateLocalFilePath(remoteUrl);
      filePath = path.join(localPath, filename);

      me.writeFile(filePath, body)
      .then(function () {
        me.files[remoteUrl] = filename;
        resolve();
      }, reject);
    });
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
  return hash.digest("hex") + "." + path.extname(parsed.pathname);
};

Fetcher.prototype.persistFilesIndex = function () {
  var content = JSON.stringify(this.files, null, 2);
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
    return me.persistFilesIndex();
  });
};

module.exports = Fetcher;
