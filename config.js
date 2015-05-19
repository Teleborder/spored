var resolvePath = require('./utils/resolve_path'),
    pkg = require('./package.json');

exports.dbPath = resolvePath('~/.spore/requests');
exports.bufferPath = resolvePath(exports.dbPath, 'buffer.db');
exports.cachePath = resolvePath(exports.dbPath, 'cache.db');
exports.port = process.env.PORT || 3768;
exports.remoteHost = 'http://spore.dev:3000';
config.proxyName = [pkg.name, pkg.version].join(" ");

