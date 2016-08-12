# Change Log


## 2.0.1 - 2016-08-12


### Fixed

- ACF-12: revert [browserify](http://browserify.org/) back to 11.0.1 (#16, @simonmarklar)

    - fixes "punycode" errors thrown by generated code

    - HelpDesk: 4669-FJLB-2701


## 2.0.0 - 2016-06-16


### Changed

- officially drop support for anything older than Node.js 4

- ACF-11: run CSS transforms on styles within HTML (#14, @jokeyrhyme)

    - this includes the content of STYLE tags, and the content of "style" attributes on tags

- ACF-11: transforms are now passed the Fetcher instance itself

    - allows transforms to access other transforms, for example

- ACF-11: transforms are expected to be proper [`stream.Transform`](https://nodejs.org/dist/latest-v4.x/docs/api/stream.html#stream_class_stream_transform) streams

    - see the [through2](https://github.com/rvagg/through2) documentation for examples

- ACF-11: transforms are expected to be able to consume [vinyl](https://github.com/gulpjs/vinyl) `File` objects, just like [gulp](https://github.com/gulpjs/gulp) plugins

- drop a dependency on [cyclonejs](https://github.com/traviskaufman/cycloneJS), our use case doesn't require `Object`s to be cloned quite so thoroughly


### Fixed

- the ".gz" stripping algorithm now avoids platform-specific behaviours in the built-in "path" module

- the Require.js extractor and shimming-transform now avoid platform-specific behaviours in the built-in "path" module


## 1.3.2 - 2016-04-06


### Fixed

- ACF-10: properly handle CSS `url()`s with quotes (#13, @jokeyrhyme)


## 1.3.1 - 2016-02-10


### Fixed

- ACF-8: prevent non-strict failures breaking later post-processing steps (#12, @jokeyrhyme)

    - HelpDesk: 5592-WEGJ-0376


## v1.3.0 - 2015-11-25


### Added


- [ACF-7](#9): added option to disable strict mode

    - without strict mode, consider failed resource fetches as non-fatal


## v1.2.1 - 2015-09-10


### Fixed

- [ACF-3](#6): download HTTP and HTTPS resources, nothing else

    - skip non-HTTP(S) protocols when parsing the AppCache manifest


## v1.2.0 - 2015-08-12


### Added

- ACF-2: the injected jQuery shim now duck-punches `$.fn.html()` so that new DOM
  content has `<img />` elements with offline URLs where possible


## v1.1.0 - 2015-07-02


### Added

- when replacing the `[src]` attribute of a `<script>` tag, keep the old value
  in `[data-appcache-src]`

- when replacing the `[href]` attribute of a `<link>` tag, keep the old value in
  `[data-appcache-href]`


## Changed

- inject the Require.js shim after the Require.js `<script>` tag if any,
  otherwise after the last `<script>` tag if any, otherwise append to `<body>`


## v1.0.3 - 2015-06-11


### Fixed

- [resolve relative output paths](#2)

- [fix issues when current working directory is not the project root](#3)


## v1.0.2 - 2015-06-10


### Changed

- `Promise` returned by `Fetcher#go()` no longer conceals errors


### Fixed

- ACF-1: fixed a bad assignment when handling the browserify streams


## v1.0.1 - 2015-06-10


### Changed

- use [graceful-fs](https://www.npmjs.com/package/graceful-fs) instead of Node's
  built-in [fs](https://nodejs.org/api/fs.html) just in case


### Fixed

- ACF-1: when [pipe](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)ing
  to an [fs.WriteStream](https://nodejs.org/api/fs.html#fs_class_fs_writestream),
  wait until the writer's "finish" event instead of the reader's "end" event
