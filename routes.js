var cache = require('./db/cache'),
    buffer = require('./db/buffer'),
    proxy = require('./proxy'),
    retry = require('./retry').retry,
    debug = require('./debug');

exports.get = function (req, res, next) {

  debug("get handler for request " + req.originalUrl);

  if(proxy.noCache(req.headers)) {
    debug("Client is requesting that we not use a cached request for " + req.originalUrl + ", forwarding.");
    
    return proxy.passThrough(req, res, next);
  }

  cache.find(req.originalUrl, function (err, response, body) {
    if(err) return next(err);
    if(response) {
      debug("Cached copy of of " + req.originalUrl + " found, sending.");
      return proxy.sendResponse(res, response, body);
    }

    debug("No cache of " + req.originalUrl + " found, requesting from remote.");

    proxy.sendRequest(req, function (err, response, body) {
      if(err) return next(err);

      if(proxy.noCache(response.headers)) {
        debug("Server is requesting that we not cache " + req.originalUrl + ", forwarding.");
        return proxy.sendResponse(res, response, body);
      }

      if(response.statusCode !== 200) {
        debug("Server responded with " + response.statusCode + " which is a not a cache-able 200");
        return proxy.sendResponse(res, response, body);
      }

      debug("Storing a cached copy of " + req.originalUrl + " for future requests.");

      cache.store(req.originalUrl, response, body, proxy.maxAge(response.headers), function (err) {
        if(err) return next(err);

        proxy.sendResponse(res, response, body);
      });
    });
  });
};

exports.post = exports.put = exports.patch = exports.delete = function (req, res, next) {
  debug(req.method + " handler for " + req.originalUrl);

  if(!proxy.noBuffer(req.headers)) {
    debug("Client does not want to accept async responses for " + req.method + " " + req.originalUrl + ", forwarding.");

    return proxy.passThrough(req, res, next);
  }

  debug("Putting " + req.method + " " + req.originalUrl + " into the retry queue.");
  buffer.store(req.method, req.originalUrl, req.headers, req.body, function (err, buf) {
    if(err) return next(err);

    debug("Request saved for later, starting queue and notifying client");

    retry.now();

    res.sendStatus(202);
  });
};
