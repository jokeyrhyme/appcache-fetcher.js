/* @flow */
'use strict';

var pify = require('pify');

var temp = require('temp');

// CIs don't need this auto-teardown, just developer machines
if ((process.env.CI || '').toLowerCase() !== 'true') {
  temp = temp.track();
}

module.exports = pify(temp);
