var os = require('os'),
    fs = require('fs'),
    childProc = require('child_process'),
    resolvePath = require('../utils/resolve_path'),
    launchAgentsPath = resolvePath('~/Library/LaunchAgents'),
    majorVersion = parseInt(os.release().split('.')[0], 10);

module.exports = function () {
  console.log("OS X detected, deregistering spored with launchd");

  // see http://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history for mappings
  if(majorVersion < 13) {
    throw new Error("spored requires OS X 10.9 or later.");
  }

  var plistPath = resolvePath(launchAgentsPath, 'sh.spore.spored.plist');

  try {
    childProc.execSync("launchctl unload " + plistPath);
  } catch(e) {
    // this errors if it isn't loaded
    // Since we're uninstalling, that's acceptable
  }

  fs.unlinkSync(plistPath);
};
