var buffer = require('./db/buffer'),
    proxy = require('./proxy');

module.exports = Retry;

function Retry() {
  this.queue = [];
}

Retry.prototype.now = function (callback) {
  if(callback) {
    this.queue.push(callback);
  }

  if(this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }

  this.next();
};

Retry.prototype.done = function () {
  if(this.timer) {
    clearTimeout(this.timer);
  }
  this.timer = null;
  this.retries = 0;
  this.finishQueue();
};

Retry.prototype.finishQueue = function (args) {
  var fn;

  while(this.queue.length) {
    fn = this.queue.shift();
    fn.apply(null, [].slice.call(arguments));
  }
};

Retry.prototype.start = function () {
  this.retries = 0;
  this.backoff();
};

Retry.prototype.backoff = function (err) {
  this.timer = setTimeout(this.retry.bind(this), expBackoff(this.retries) * 1000);

  if(err) {
    this.finishQueue(err);
  }
};

Retry.prototype.retry = function () {
  var self = this;

  this.retries++;

  this.next();
};

Retry.prototype.next = function () {
  var self = this;

  buffer.retrieveNext(function (err, request, body) {
    if(err) return self.error(err);
    if(!request) {
      self.log("No requests found to retry");
      self.done();
      return ;
    }

    self.log("Sending request: " + request.method + " " + request.url);
    self.log(request.headers);
    self.log(body ? body.toString('utf8') : undefined);

    proxy.sendRequestImmediate({
      originalUrl: request.url,
      method: request.method,
      body: body,
      headers: request.headers
    }, function (err, response, body) {
      if(err) {
        self.log("Network error (" + err.message + ") encountered when retrying " + request.url + ", backing off.");
        self.backoff(err);
      }

      self.log(request.url + " completed, removing from the buffer");
      self.log("Response to " + request.method + " " + request.url);
      self.log(response.statusCode);
      self.log(response.headers);
      self.log(body ? body.toString('utf8') : undefined);

      buffer.remove(request._id, function (err) {
        if(err) return self.error(err);

        self.next();
      });
    });
  });
};

Retry.prototype.error = function (err) {
  console.error(err);
  // TODO: write to a central error log
};

Retry.prototype.log = function (log) {
  console.log(log);
  // TODO: write to a central log file
};

// Exponential backoff
function expBackoff(retries) {
  var spread = Math.random() + 1,
      base = 2,
      initial = 30,
      max = 7200; // 2 hours in seconds

  return Math.min(spread * initial * Math.pow(base, retries));
}

var retry = new Retry();

Retry.retry = retry;
Retry.start = retry.start.bind(retry);
