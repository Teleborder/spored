var Datastore = require('nedb'),
    config = require('../config'),
    debug = require('../debug'),
    cache = new Datastore({ filename: config.cachePath, autoload: true });

exports.find = function (url, callback) {
  cache.find({
    method: 'GET',
    url: url,
    expires: {
      $gt: new Date()
    }
  }).sort({ fulfilledAt: 1 }).limit(1).exec(function (err, responses) {
    if(err) return callback(err);

    var response = responses[0];

    if(response && response.statusCode && response.headers && response.body) {
      return callback(null, { statusCode: response.statusCode, headers: response.headers }, response.body);
    }

    callback();
  });
};

exports.store = function (url, response, body, maxAge, callback) {
  var now = new Date(),
      expires = new Date();

  expires.setTime(now.getTime() + maxAge);

  var request = {
    method: 'GET',
    url: url,
    body: body,
    statusCode: response.statusCode,
    headers: response.headers,
    fulfilledAt: now,
    expires: expires
  };

  if(maxAge <= 0) {
    debug(url + " has a maxAge of 0, not caching");

    process.nextTick(function () {
      callback(null, request);
    });

    return;
  }

  cache.insert(request, callback);
};

exports.prune = function (callback) {
  cache.remove({
    expires: {
      $lt: new Date()
    }
  }, {
    multi: true
  }, callback);
};
