var cache = require('./db/cache'),
    buffer = require('./db/buffer'),
    config = require('./config'),
    debug = require('./debug');

exports.get = function (req, res, next) {

  if(noCache(req.headers)) {
    debug("Client is requesting that we not use a cached request for " + req.originalUrl + ", forwarding.");
    
    return passThrough(req, res, next);
  }

  cache.find(req.originalUrl, function (err, response, body) {
    if(err) return next(err);
    if(response) {
      debug("Cached copy of of " + req.originalUrl + " found, sending.");
      return sendResponse(response, body);
    }

    sendRequest(req, function (err, response, body) {
      if(err) return next(err);

      if(noCache(response.headers)) {
        debug("Server is requesting that we not cache " + req.originalUrl + ", forwarding.");
        return sendResponse(response, body);
      }

      debug("Storing a cached copy of " + req.originalUrl + " for future requests.");

      cache.store(req.originalUrl, response, body, maxAge(response.headers), function (err) {
        if(err) return next(err);

        sendResponse(response, body);
      });
    });
  });
};

exports.post = exports.put = exports.patch = exports.delete = function (req, res, next) {
  if(!noBuffer(req.headers)) {
    debug("Client does not want to accept async responses for " + req.method + " " + req.originalUrl + ", forwarding.");

    return passThrough(req, res, next);
  }

  buffer.store(req.method, req.originalUrl, req.headers, req.body, function (err, buf) {
    if(err) return next(err);

    sendRequest(req, function (err, response, body) {
      if(err) {
        // error while connecting, keep the buffer
        // tell the client where they can monitor it
        // and how long they should wait before trying again
        res.set('Location', '/__buffered/' + buf._id);
        res.set('Retry-After', buf.tryNextAt);
        res.sendStatus(202);
        return;
      }

      // request was successful, remove our stored one
      buffer.remove(bufId, function (err) {
        if(err) return next(err);

        sendResponse(res, response, body);
      });
    });
  });
};

function passThrough (req, res, next) {
  sendRequest(req, function (err, response, body) {
    if(err) return next(err);

    sendResponse(res, response, body);
  });
}

function sendResponse(res, response, body) {
  res.set(response.headers);

  // Add our proxy info
  res.append('Via', config.proxyName);

  res.status(response.statusCode).send(body);
}

function sendRequest(req, callback) {
  var headers = req.headers;

  // Add our proxy info
  if(!headers['via']) {
    headers['via'] = config.proxyName;
  } else {
    headers['via'] += ", " + config.proxyName;
  }

  request({
    url: fullUrl(req.originalUrl),
    method: req.method,
    body: req.body,
    headers: headers
  }, callback);
}

function noCache(headers) {
  return headerHasValue(headers, 'pragma', 'no-cache') || headerHasValue(headers, 'cache-control', 'no-cache');
}

function noBuffer(headers) {
  return !headerHasValue(headers, 'prefer', 'respond-async');
}

function maxAge(headers) {
  if(headers['cache-control']) {

    var cacheControls = headerValues(headers, 'cache-control');

    for(var i=0; i<cacheControls.length; i++) {
      if(cacheControls[i] && cacheControls[i].split('=')[0] === 'max-age' && cacheControls[i].split('=')[1]) {
        debug("cache-control max-age directive found");
        return parseInt(cacheControls[i].split('=')[1], 10);
      }
    }
  }

  if(headers['expires']) {
    var expires = new Date(headers['expires']),
        now = new Date();

    debug("expires directive found");
    return expires.getTime() - now.getTime();
  }

  debug("No maxAge directive found in headers, setting maxAge to zero");
  return 0;
}

function headerHasValue(headers, name, value) {
  headerValues(headers, name).some(function (val) {
    return val === value;
  });
}

function headerValues(headers, name) {
  return (headers[name] || "").split(',').map(function (val) {
    return val.trim();
  }).filter(function (val) {
    return !!val;
  });
}

function fullUrl(url) {
  return config.remoteHost + url;
}
