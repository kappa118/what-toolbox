# What Toolbox

This project is designed to be a toolbox of commands that can be used against any [gazelle](https://github.com/WhatCD/Gazelle) site. The idea came after what.cd went down, I had no idea the release information for many of the albums I had. So I wrote the first command (`download-release-info`). Then, with all the talk of people wishing they had caches of various pages, I wrote the second command (`screenshot`). After that, I decided to put them all together in some sort of 'toolbox' that could be used.

## Install

You can install the application globally with `npm`:

```
git clone git@github.com:kappa118/what-toolbox.git
cd what-toolbox
npm install -g .
```

Or you can run it locally out of the directory (either `git clone` or download the zip file).

```
cd what-toolbox
npm install
node ./node_modules/gulp/bin/gulp.js # This transpiles for compatibility with older verions of node
./bin/what
```

## Usage

All commands can be found by executing `what`

```
 __      __.__            __
/  \    /  \  |__ _____ _/  |_
\   \/\/   /  |  \\__  \\   __\
 \        /|   Y  \/ __ \|  |
  \__/\  / |___|  (____  /__|
       \/       \/     \/

what version 1.0.0

Usage:
  what command [flags] [options] [arguments]

Commands:
  config                 Read, write, and reset config values
  delete-everything      Remove all files and folders related to the CLI
  download-release-info  Download and save release info to a text file for all
                         active seeds
  screenshot             Download and save release info to a text file for all
                         active seeds

Global Flags:
  -h, --help     Show help                                             [boolean]
  -v, --verbose  Output verbosity: 1 for normal (-v), 2 for more verbose (-vv),
                 and 3 for debug (-vvv)                                  [count]
  -q, --quiet    Suppress all output                                   [boolean]
  -V, --version  Show version number                                   [boolean]
```

## Commands

All commands have their own individual `help` screen that can be viewed by appending `-h`, `--help`, or `help` to the end.

### `config`

The `config` command is designed to persist specific options through uses (i.e., log file destination, verbosity, etc.). All of the options that are site-specific can always be overridden with each command, this way you can have a "default" but still execute a command against a different site at any time.

If you only plan to use this with one gazelle site, you can pre-populate the `config` with all of your information to prevent you from having to specify the options during every execution.

```
$ what config
host                 =
dir:seeds            = /tmp
dir:screenshots      = /tmp
user:name            =
user:id              =
user:password        =
dir:seed             =
cli.colors           = true
cli.progressBars     = true
cli.progressInterval = 250
cli.timestamp        = false
json.pretty          = false
log.file             =
log.level            = info
```

Simply execute `what config [OPTION] [VALUE]` to set a value. You can reset a value to its default with `what config [OPTION] -r` or simply view a single option's value with `what config [OPTION]`.

```
$ what config host https://passtheheadphones.me
host saved
```

### `download-release-info`

This command will go through your currently active seeds and download the release information for each one, saving it into the seed directory with a site-specific filename (this allows you to run this against cross-seeds).

As mentioned above, this command will, by default, use your `host`, `username`, `user-id`, and `password` from the `config` unless specified by the command line options.

```
$ what download-release-info --username guest --password guest --host https://apollo.rip --user-id 0 --seed-directory /home/me/seeds
```

### `screenshot`

This command will, by default, take a screenshot of the homepage as well as your user page. You can specify a specific page to screenshot by including the `--url` and `--name` along with the command. (`--name` is required to know what to name the saved file). All screenshots are timestamped so they can be accumulated over time.

```
$ what screenshot
```

## Contributing

Contributions and bug fixes are more than welcome. If you run into any issues, please open an issue with as much detail as you can including the command and site you are running the tool against.
