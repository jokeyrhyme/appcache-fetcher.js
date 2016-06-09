# appcache-fetcher.js [![npm module](https://img.shields.io/npm/v/@jokeyrhyme/appcache-fetcher.svg)](https://www.npmjs.com/package/@jokeyrhyme/appcache-fetcher) [![AppVeyor Status](https://ci.appveyor.com/api/projects/status/github/jokeyrhyme/appcache-fetcher.js?branch=master&svg=true)](https://ci.appveyor.com/project/jokeyrhyme/appcache-fetcher.js) [![Travis CI Status](https://travis-ci.org/jokeyrhyme/appcache-fetcher.js.svg?branch=master)](https://travis-ci.org/jokeyrhyme/appcache-fetcher.js)

store an AppCache-enabled site on disk for local use


## Usage


### FetcherOptions

- @typedef {Object} FetcherOptions

- @property {string} localPath - filesystem directory to store assets.
- @property {string} remoteUrl
- @property {boolean} [strictMode=true] - W3C behaviour, halt on failure.


### `new Fetcher(opts)`

- @constructor
- @param {FetcherOptions} opts


### `Fetcher#go()`

Trigger the whole process, downloading remote assets, processing them,
and storing them locally.
