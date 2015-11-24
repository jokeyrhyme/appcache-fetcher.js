# appcache-fetcher.js

store an AppCache-enabled site on disk for local use

[![npm module](https://img.shields.io/npm/v/@jokeyrhyme/appcache-fetcher.svg)](https://www.npmjs.com/package/@jokeyrhyme/appcache-fetcher)
[![travis-ci](https://img.shields.io/travis/jokeyrhyme/appcache-fetcher.js.svg)](https://travis-ci.org/jokeyrhyme/appcache-fetcher.js)


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
