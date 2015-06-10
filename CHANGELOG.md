# Changelog


## v1.0.1 - 2015-06-10


### Changed

- use [graceful-fs](https://www.npmjs.com/package/graceful-fs) instead of Node's
  built-in [fs](https://nodejs.org/api/fs.html) just in case


### Fixed

- ACF-1: when [pipe](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)ing
  to an [fs.WriteStream](https://nodejs.org/api/fs.html#fs_class_fs_writestream),
  wait until the writer's "finish" event instead of the reader's "end" event
