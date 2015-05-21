var config = require('./config'),
    debug = require('./debug'),
    request = require('request'),
    retry = require('./retry').retry;

exports.passThrough = passThrough;
function passThrough (req, res, next) {
  sendRequest(req, function (err, response, body) {
    if(err) return next(err);

    sendResponse(res, response, body);
  });
}

exports.sendResponse = sendResponse;
function sendResponse(res, response, body) {
  res.set(response.headers);

  // Add our proxy info
  res.append('Via', config.proxyName);

  res.status(response.statusCode).send(body);
}

exports.sendRequest = sendRequest;
function sendRequest(req, callback) {
  retry.now(function (err) {
    if(err) return callback(err);

    sendRequestImmediate(req, callback);
  });
}

exports.sendRequestImmediate = sendRequestImmediate;
function sendRequestImmediate(req, callback) {
  var headers = req.headers;

  // Add our proxy info
  if(!headers.via) {
    headers.via = config.proxyName;
  } else {
    headers.via += ", " + config.proxyName;
  }

  request({
    url: fullUrl(req.originalUrl),
    method: req.method,
    body: Buffer.isBuffer(req.body) ? req.body : undefined,
    encoding: null,
    headers: headers
  }, function (err, response, body) {
    if(err) return next(err);

    callback(null, response, body);
  });
}

// check whether a request should be cached as a GET request,
// and get the contents of a fake GET request
exports.postCache = postCache;
function postCache(req) {
  if(req.method.toUpperCase() !== 'POST') {
    return false;
  }

  if(!Buffer.isBuffer(req.body)) {
    return false;
  }

  var body,
      url;

  try {
    body = JSON.parse(req.body.toString('utf8'));
  } catch(e) {
    return false;
  }

  if(!body.id) {
    return false;
  }

  url = req.originalUrl + '/' + body.id;

  return {
    method: 'GET',
    url: url,
    body: req.body,
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Connection: 'keep-alive'
    }
  };
}

exports.noCache = noCache;
function noCache(headers) {
  return headerHasValue(headers, 'pragma', 'no-cache') || headerHasValue(headers, 'cache-control', 'no-cache');
}

exports.noBuffer = noBuffer;
function noBuffer(headers) {
  return !headerHasValue(headers, 'prefer', 'respond-async');
}

exports.maxAge = maxAge;
function maxAge(headers) {
  if(!headers) {
    debug("No headers given, returning maximum maxAge of 1 year");
    return 31536000;
  }

  if(headers['cache-control']) {

    var cacheControls = headerValues(headers, 'cache-control');

    for(var i=0; i<cacheControls.length; i++) {
      if(cacheControls[i] && cacheControls[i].split('=')[0] === 'max-age' && cacheControls[i].split('=')[1]) {
        debug("cache-control max-age directive found");
        return parseInt(cacheControls[i].split('=')[1], 10);
      }
    }
  }

  if(headers.expires) {
    var expires = new Date(headers.expires),
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
  return config.host + url;
}
