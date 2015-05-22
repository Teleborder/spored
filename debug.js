var debug = require('debug')('spored');
debug.log = console.log.bind(console);

module.exports = debug;
