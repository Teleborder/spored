var debug = require('./debug');

module.exports = function prune (secs) {
  debug("Setting prune timer for " + secs + " seconds");
  var self = this;

  setTimeout(function () {
    self.cache.prune(function (err, pruned) {
      if(err) return console.error(err);

      debug("Prune finished, removed " + pruned + " cached responses");

      self.prune(secs);
    });
  }, secs * 1000);
};

