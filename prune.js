var cache = require('./db/cache'),
    debug = require('./debug');

module.exports = function prune (secs) {
  debug("Setting prune timer for " + secs + " seconds");

  setTimeout(function () {
    cache.prune(function (err, pruned) {
      if(err) return console.error(err);

      debug("Prune finished, removed " + pruned + " cached responses");

      prune(secs);
    });
  }, secs * 1000);
};

