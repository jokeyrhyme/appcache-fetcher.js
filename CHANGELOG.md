# Changelog


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
