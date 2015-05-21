var resolvePath = require('./utils/resolve_path'),
    pkg = require('./package.json'),
    home = process.env.SPORE_HOME || '~/.spore',
    configFile = 'config.json',
    fs = require('fs-extra'),
    config;

fs.ensureDirSync(resolvePath(home));

try {
  config = fs.readJsonSync(resolvePath(home, configFile));
} catch(e) {
  if(e.code !== 'ENOENT') {
    throw e;
  }
}

config = config || {};
config.spored = config.spored || {};

exports.sporedPath = resolvePath(config.spored.home || home + '/spored');

fs.ensureDirSync(exports.sporedPath);

exports.bufferPath = resolvePath(exports.sporedPath, 'buffer.db');
exports.cachePath = resolvePath(exports.sporedPath, 'cache.db');
exports.port = config.spored.port || 8380;
exports.host = config.spored.remote || "http://spore.dev:3000";
exports.name = config.spored.name || [pkg.name, pkg.version].join(" ");

