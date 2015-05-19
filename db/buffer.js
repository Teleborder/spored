var Datastore = require('nedb'),
    config = require('./config'),
    buffer = new Datastore({ filename: config.bufferPath, autoload: true});

exports.store = function (method, url, headers, body, callback) {
  var request = {
    method: method,
    url: url,
    headers: headers,
    body: body,
    createdAt: new Date(),
    tryNextAt: tryNext(0, new Date()),
    retries: 0
  };

  requests.insert(request, callback);
};

exports.remove = function (id, callback) {
  requests.remove({
    _id: id
  }, callback);
};

exports.retrieveNext = function (callback) {
  requests.find({
    tryNextAt: {
      $lte: new Date()
    }
  }, callback);
};

function tryNext(retries, lastAttempt) {
  var nextAttempt = new Date();
  nextAttempt.setTime(lastAttempt.getTime() + expBackoff(retries));
  return nextAttempt;
}

// Exponential backoff
function expBackoff(retries) {
  var spread = Math.random() + 1,
      base = 2,
      initial = 30,
      max = 43200; // 12 hours

  return Math.min(spread * initial * Math.pow(base, retries));
}
