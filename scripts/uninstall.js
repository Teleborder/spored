var os = require('os'),
    resolvePath = require('../utils/resolve_path'),
    osx = require('./osx-uninstall.js');

if(os.platform() === 'darwin') {
  return osx(npmBin, config.proxyPath);
}

console.log("IMPORTANT UNINSTALLATION INFORMATION");
console.log("");
console.log("When installing spored, you may have set it up as a persistent daemon or service.");
console.log("You'll probably need to unregister or uninstall that daemon separately from this uninstall process.");
console.log("Your init system is something like upstart (Ubuntu), systemd, or SysV init.");
console.log("If you're on Windows, it was likely set up as a service.");
