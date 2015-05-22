var express = require('express'),
    Datastore = require('nedb'),
    merge = require('merge'),
    defaultConfig = require('./config'),
    debug = require('./debug'),
    bodyParser = require('body-parser'),
    routes = require('./routes'),
    Retry = require('./retry'),
    cache = require('./db/cache'),
    buffer = require('./db/buffer'),
    prune = require('./prune'),
    proxy = require('./proxy');

module.exports = Spored;

function Spored(config) {
  this.config = merge(config || {}, defaultConfig);

  this.app = express();

  this.setupRoutes();
  this.setupDatabases();
  this.setupProxy();

  this.retry = new Retry(this.proxy, this.buffer);
}

Spored.prototype.setupRoutes = function () {
  this.app.use(function (req, res, next) {
    debug("INCOMING " + req.method + " " + req.originalUrl);
    next();
  });

  this.app.use(bodyParser.raw({
    type: '*/*'
  }));

  this.routes = merge(true, routes);
  this.routes.spored = this;

  this.app.get('*', this.routes.get.bind(this.routes));
  this.app.post('*', this.routes.post.bind(this.routes));
  this.app.put('*', this.routes.put.bind(this.routes));
  this.app.patch('*', this.routes.patch.bind(this.routes));
  this.app.delete('*', this.routes.delete.bind(this.routes));

  this.app.use(function (req, res, next) {
    res.sendStatus(404);
  });
};

Spored.prototype.setupDatabases = function () {
  this.cache = merge(true, cache);
  this.cache.db = new Datastore({ filename: this.config.cachePath, autoload: true });

  this.buffer = merge(true, buffer);
  this.buffer.db = new Datastore({ filename: this.config.bufferPath, autoload: true });
};

Spored.prototype.setupProxy = function () {
  this.proxy = merge(true, proxy);
  this.proxy.spored = this;
};

Spored.prototype.run = function () {
  var server = this.server = this.app.listen(this.config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    debug('spored listening at http://%s:%s', host, port);
  });

  this.retry.start();
  prune(this.config.pruneTime);

  return this;
};




