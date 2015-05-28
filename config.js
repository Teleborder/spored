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
config.proxy = config.proxy || {};

exports.proxyPath = resolvePath(config.proxy.home || home + '/spored');

fs.ensureDirSync(exports.proxyPath);

exports.bufferPath = resolvePath(exports.proxyPath, 'buffer.db');
exports.cachePath = resolvePath(exports.proxyPath, 'cache.db');
exports.port = config.proxy.port || 8380;
exports.host = config.host || "http://spore.dev:3000";
exports.name = config.proxy.name || [pkg.name, pkg.version].join(" ");
exports.pruneTime = config.proxy.prune || 3600;

