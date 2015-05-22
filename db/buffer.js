var Datastore = require('nedb'),
    config = require('../config'),
    buffer = new Datastore({ filename: config.bufferPath, autoload: true });

exports.store = function (method, url, headers, body, callback) {
  debug("storing request " + method + " " + url);

  var request = {
    method: method,
    url: url,
    headers: headers,
    body: Buffer.isBuffer(body) ? body.toString('base64') : undefined,
    createdAt: new Date()
  };

  buffer.insert(request, callback);
};

exports.remove = function (id, callback) {
  debug("Removing buffered request " + id);
  buffer.remove({
    _id: id
  }, callback);
};

exports.retrieveNext = function (callback) {
  debug("Getting next buffered request");

  buffer.find({}).sort({ createdAt: 1 }).limit(1).exec(function (err, docs) {
    if(err) return callback(err);
    if(!docs[0]) return callback();

    var body;

    if(docs[0].body) {
      body = new Buffer(docs[0].body, 'base64');
    }

    callback(null, docs[0], body);
  });
};
