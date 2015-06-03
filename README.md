spored
------

`spored` is the Spore Daemon, a small proxy server that runs locally on your machine in tandem with the [`spore-cli`](https://github.com/spore-sh/spore-cli-node) to boost performance and allow for offline capability.


### Installation

The preferred method of installation is using the [official install script](https://spore.sh/documentation#installation).

However, you can install `spored` on it's own with the following:

```
$ npm install -g spored
```

or:

```
$ npm install -g git://git@github.com:spore-sh/spored.git
```

### Starting Spored

#### Auto

`spored` should ideally be run as a daemonized server that is started automatically. This module contains
a [postinstall script](scripts/postinstall.js) to set that up on your system. Currently only OS X is supported (via `launchd`).

If you're not using OS X, you'll need to set it up yourself. If you're using Linux, you'll likely use `systemd` for this,
or `upstart` if you're using Ubuntu. On Windows, this will probably be service.

If you figure out how to get it set up for your system, please submit a Pull Request to assist others!

#### Manual

To start `spored` manually, use the following command:

```
$ spored
```

Logs will go to `stdout`, errors will go to `stderr`. The logging will
be very minimal unless you set the environment varialbe `DEBUG` to "spored".


### Contributing

1. Fork
2. Branch
3. Write (& Test)
4. Pull Request
