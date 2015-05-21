var Datastore = require('nedb'),
    config = require('../config'),
    buffer = new Datastore({ filename: config.bufferPath, autoload: true });

exports.store = function (method, url, headers, body, callback) {
  var request = {
    method: method,
    url: url,
    headers: headers,
    body: body,
    createdAt: new Date()
  };

  requests.insert(request, callback);
};

exports.remove = function (id, callback) {
  requests.remove({
    _id: id
  }, callback);
};

exports.retrieveNext = function (callback) {
  requests.find({}).sort({ createdAt: -1 }).limit(1).exec(function (err, docs) {
    if(err) return callback(err);
    callback(null, docs[0]);
  });
};
