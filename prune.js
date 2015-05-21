var cache = require('./db/cache');

module.exports = function prune (secs) {
  setTimeout(function () {
    cache.prune(function (err) {
      if(err) throw err;

      prune(secs);
    });
  }, secs * 1000);
};

