var npm = require('npm'),
    os = require('os'),
    resolvePath = require('../utils/resolve_path'),
    config = require('../config'),
    osx = require('./osx-postinstall.js'),
    npmBin;

npm.load(function (err) {
  if(err) throw err;

  npmBin = resolvePath(npm.config.get('prefix'), 'bin');

  if(os.platform() === 'darwin') {
    return osx(npmBin, config.proxyPath);
  }

  console.log("IMPORTANT INSTALLATION INFORMATION");
  console.log("");
  console.log("For spored to function properly, it needs to run as a persistent daemon or service.");
  console.log("You'll probably need to register spored as a daemon on your system's init system.");
  console.log("Your init system is something like upstart (Ubuntu), systemd, or SysV init.");
  console.log("If you're on Windows, this will likely need to be run as a service.");
  console.log("");
  console.log("When you get a daemon set up, it should use the equivalent of this bash command:");
  console.log("    DEBUG=\"spored\" " + resolvePath(npmBin, 'spored') + " >" + resolvePath(config.proxyPath, 'log.log') + " 2>" + resolvePath(config.proxyPath, 'error.log'));
  console.log("");
});


