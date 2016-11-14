'use strict';

const test = require('ava');

test('package.json dependencies includes browserify 11.0.1', (t) => {
  const pkg = require('../package.json');
  t.is(pkg.dependencies.browserify, '11.0.1');
});

test('browserify 11.0.1 installed in node_modules', (t) => {
  const pkg = require('browserify/package.json');
  t.is(pkg.version, '11.0.1');
});
