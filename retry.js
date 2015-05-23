var debug = require('./debug');

module.exports = Retry;

function Retry(proxy, buffer) {
  this.queue = [];
  this.proxy = proxy;
  this.buffer = buffer;
}

Retry.prototype.now = function (callback) {
  this.log("starting queue now");

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
  this.log("retried requests complete");

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
  this.log("Starting retry timer");

  this.retries = 0;
  this.backoff();
};

Retry.prototype.backoff = function (err) {
  this.timer = setTimeout(this.retry.bind(this), expBackoff(this.retries) * 1000);

  if(err) {
    debug("backoff Err, err'ing the queue");
    this.finishQueue(err);
  }
};

Retry.prototype.retry = function () {
  this.retries++;

  this.log("Retrying again (#" + this.retries + ")");

  this.next();
};

Retry.prototype.next = function () {
  var self = this;

  this.buffer.retrieveNext(function (err, request, body) {
    if(err) return self.error(err);
    if(!request) {
      self.log("No requests found to retry");
      self.done();
      return ;
    }

    self.log("Found " + [request.method, request.url].join(" ") + "(id: " + request._id + ") to retry");

    self.proxy.sendRequestImmediate({
      originalUrl: request.url,
      method: request.method,
      body: body,
      headers: request.headers
    }, self._handleResponse(request));
  });
};

Retry.prototype._handleResponse = function (request) {
  var self = this;

  return function (err, response, body) {
    if(err) {
      self.log("Network error (" + err.message + ") encountered when retrying " + request.method + " " + request.url + ", backing off.");
      return self.backoff(err);
    }

    self.log(request.method + " " + request.url + " completed with status code " + response.statusCode);

    self._responseError(request, response, body);

    self.log("Removing " + request.method + " " + request.url + " from the buffer");

    self.buffer.remove(request._id, function (err) {
      if(err) return self.error(err);

      self.next();
    });
  };
};

Retry.prototype._responseError = function (request, response, body) {
  if([200, 201, 204].indexOf(response.statusCode) === -1) {
    this.error("Status code " + response.statusCode + " while performing " + request.method + " " + request.url);

    var json;

    try {
      json = JSON.parse(body.toString('utf8'));
    } catch(e) {
      this.error("Unknown error, body not parseable. String body is below:");
      this.error(body.toString('utf8'));
    }
    
    this.error(json.error || ("JSON body contained no errors: " + JSON.stringify(json)));
  }
};

Retry.prototype.error = function (err) {
  if(err instanceof Error) {
    err = err.message;
  }
  console.error(err);
};

Retry.prototype.log = function (log) {
  debug(log);
};

// Exponential backoff
function expBackoff(retries) {
  var spread = Math.random() + 1,
      base = 2,
      initial = 30,
      max = 7200; // 2 hours in seconds

  return Math.min(spread * initial * Math.pow(base, retries));
}
