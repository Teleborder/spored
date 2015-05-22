var debug = require('../debug');

exports.find = function (url, callback) {
  this.db.find({
    method: 'GET',
    url: url,
    expires: {
      $gt: new Date()
    }
  }).sort({ fulfilledAt: 1 }).limit(1).exec(function (err, responses) {
    if(err) return callback(err);

    var response = responses[0];

    if(response) {
      return callback(null, { statusCode: response.statusCode, headers: response.headers }, new Buffer(response.body, 'base64'));
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
    body: Buffer.isBuffer(body) ? body.toString('base64') : undefined,
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

  this.db.insert(request, callback);
};

exports.prune = function (callback) {
  debug("Pruning cache");

  this.db.remove({
    expires: {
      $lt: new Date()
    }
  }, {
    multi: true
  }, callback);
};
