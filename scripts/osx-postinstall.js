var mustache = require('mustache'),
    os = require('os'),
    fs = require('fs'),
    path = require('path'),
    which = require('which'),
    childProc = require('child_process'),
    resolvePath = require('../utils/resolve_path'),
    launchAgentsPath = resolvePath('~/Library/LaunchAgents'),
    plistTemplate = fs.readFileSync(resolvePath(__dirname, 'sh.spore.spored.plist.mustache'), { encoding: 'utf8' }),
    majorVersion = parseInt(os.release().split('.')[0], 10);

module.exports = function (npmBin, sporedHome) {
  console.log("OS X detected, registering spored with launchd");

  // see http://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history for mappings
  if(majorVersion < 13) {
    throw new Error("spored requires OS X 10.9 or later.");
  }

  var nodeBin = path.dirname(which.sync('node')),
      plist = mustache.render(plistTemplate, { NPM_BIN: npmBin, NODE_BIN: nodeBin, SPORED_HOME: sporedHome}),
      plistPath = resolvePath(launchAgentsPath, 'sh.spore.spored.plist');

  fs.writeFileSync(plistPath, plist);

  if(majorVersion >= 14) {
    try {
      childProc.execSync("launchctl bootstrap gui/" + process.getuid() + " " + plistPath);
    } catch(e) {
      // this errors if it's already bootstrapped. Since `unbootstrap` is not yet implemented,
      // we'll just ignore this
    }
    childProc.execSync("launchctl enable gui/" + process.getuid() + "/sh.spore.spored");
    childProc.execSync("launchctl kickstart -k gui/" + process.getuid() + "/sh.spore.spored");
  } else {
    try {
      childProc.execSync("launchctl unload " + plistPath);
    } catch(e) {
      // this errors if it hasn't ever been loaded.
      // That must mean this is our first time, so we'll ignore
    }
    childProc.execSync("launchctl load -Fw " + plistPath);
  }
};
