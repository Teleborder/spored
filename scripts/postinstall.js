var npm = require('npm'),
    path = require('path'),
    os = require('os'),
    config = require('../config'),
    osx = require('./osx-postinstall.js'),
    npmBin;

npm.load(function (err) {
  if(err) throw err;

  npmBin = path.resolve(npm.config.get('prefix'), 'bin');

  if(os.platform() === 'darwin') {
    return osx(npmBin, config.proxyPath);
  }

  // no other platforms supported
});


