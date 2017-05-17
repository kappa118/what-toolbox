'use strict';

let semver = require('semver'),
  pkgJson = require('../package.json'),
  chalk = require('chalk'),
  yargs = require('yargs'),
  Command = require('./Commands/Command'),
  Config = require('./Config'),
  Logger = require('./Logger'),
  async = require('async'),
  banner = `        .__            __
__  _  _|  |__ _____ _/  |_
\\ \\/ \\/ /  |  \\\\__  \\\\   __\\
 \\     /|   Y  \\/ __ \\|  |
  \\/\\_/ |___|  (____  /__|
             \\/     \\/
`;

// check that we're using Node.js 0.12 or newer
try {
	if (semver.lt(process.version, '0.12.0')) {
		console.error(`${chalk.cyan.bold(pkgJson.name)}, CLI version ${pkgJson.version}
${chalk.white.bgRed(`ERROR: ${pkgJson.name} requires Node.js 0.12 or newer`)}
Visit ${chalk.cyan('http://nodejs.org/')} to download a newer version.`);

		process.exit(1);
	}
} catch (e) {}

let appName = 'what-toolbox';
if (yargs.argv['site']) {
  appName += `-${yargs.argv['site']}`;
}

Command.setAppName(appName);

let cliConfig = {
  commands: {
    'config': {
      usage: '[flags] [key] [value]',
      desc: 'Read, write, and reset config values',
      options: {
        r: {
          group: 'Flags:',
          alias: 'reset',
          demand: false,
          desc: 'Reset the config option to its default value',
          type: 'boolean',
        },
      },
      file: './Commands/ConfigCommand',
    },
    'delete-everything': {
      usage: '',
      desc: 'Remove all files and folders related to the CLI',
      options: {},
      file: './Commands/DeleteEverythingCommand',
    },
    'snatch:freeleech': {
      usage: '',
      desc: 'Download and save release info to a text file for all active seeds',
      options: {
        'dry-run': {
          group: 'Flags:',
          demand: false,
          desc: 'Run the command without actually snatching anything',
          type: 'boolean',
        },
        'username': {
          group: 'Options:',
          demand: false,
          desc: 'Your username on the site',
          type: 'string',
        },
        'password': {
          group: 'Options:',
          demand: false,
          desc: 'Your password on the site',
          type: 'string',
        },
        'host': {
          group: 'Options:',
          demand: false,
          desc: 'Website host',
          type: 'string',
        },
        'torrents-directory': {
          group: 'Options:',
          demand: false,
          desc: 'Location of your seeds',
          type: 'string',
        },
      },
      file: './Commands/SnatchFreeleechCommand',
    },
    'download-release-info': {
      usage: '',
      desc: 'Download and save release info to a text file for all active seeds',
      options: {
        'username': {
          group: 'Options:',
          demand: false,
          desc: 'Your username on the site',
          type: 'string',
        },
        'password': {
          group: 'Options:',
          demand: false,
          desc: 'Your password on the site',
          type: 'string',
        },
        'user-id': {
          group: 'Options:',
          demand: false,
          desc: 'Your user ID on the site',
          type: 'string',
        },
        'host': {
          group: 'Options:',
          demand: false,
          desc: 'Website host',
          type: 'string',
        },
        'seed-directory': {
          group: 'Options:',
          demand: false,
          desc: 'Location of your seeds',
          type: 'string',
        },
        'force': {
          group: 'Flags:',
          demand: false,
          desc: 'Force writing release info file if it already exists',
          type: 'boolean',
        },
        'create': {
          group: 'Flags:',
          demand: false,
          desc: 'Create non-existent torrent directories',
          type: 'boolean',
        },
      },
      file: './Commands/DownloadReleaseInfoCommand',
    },
    'screenshot': {
      usage: '',
      desc: 'Download and save release info to a text file for all active seeds',
      options: {
        'username': {
          group: 'Options:',
          demand: false,
          desc: 'Your username on the site',
          type: 'string',
        },
        'password': {
          group: 'Options:',
          demand: false,
          desc: 'Your password on the site',
          type: 'string',
        },
        'user-id': {
          group: 'Options:',
          demand: false,
          desc: 'Your user ID on the site',
          type: 'string',
        },
        'host': {
          group: 'Options:',
          demand: false,
          desc: 'Website host',
          type: 'string',
        },
        'save-directory': {
          group: 'Options:',
          demand: false,
          desc: 'Location to save the screenshots to',
          type: 'string',
        },
      },
      file: './Commands/ScreenshotCommand',
    },
    'version': {
      usage: '',
      desc: false,
      options: {},
      callback: callback => {
        Logger.info(`v${pkgJson.version}`);
        callback(0);
      },
    },
  },
  global: {
    options: {
      h: {
        group: 'Global Flags:',
      },
      v: {
        group: 'Global Flags:',
        alias: 'verbose',
        demand: false,
        desc: 'Output verbosity: 1 for normal (-v), 2 for more verbose (-vv), and 3 for debug (-vvv)',
        type: 'count',
      },
      q: {
        group: 'Global Flags:',
        alias: 'quiet',
        demand: false,
        desc: 'Suppress all output',
        type: 'boolean',
      },
      cache: {
        group: 'Global Flags:',
        demand: false,
        desc: 'Specify location of cache directory',
        type: 'string',
      },
      config: {
        group: 'Global Flags:',
        demand: false,
        desc: 'Specify location of config file',
        type: 'string',
      },
      site: {
        group: 'Global Flags:',
        demand: false,
        desc: 'Specify a site to run as',
        type: 'string',
      },
      V: {
        group: 'Global Flags:',
      },
    },
  },
},
  appConfig = {
    'host': {
      type: 'string',
      default: '',
    },
    'dir.seeds': {
      type: 'string',
      default: '/tmp',
    },
    'dir.screenshots': {
      type: 'string',
      default: '/tmp',
    },
    'dir.torrents': {
      type: 'string',
      default: '/tmp',
    },
    'snatch.formats': {
      type: 'list',
      default: 'FLAC,320,V2,V0',
    },
    'snatch.media': {
      type: 'list',
      default: 'CD',
    },
    'snatch.minRatio': {
      type: 'string',
      default: 1,
    },
    'user.name': {
      type: 'string',
      default: '',
    },
    'user.id': {
      type: 'string',
      default: '',
    },
    'user.password': {
      type: 'string',
      default: '',
    },
    'cli.colors': {
      type: 'bool',
      default: true,
    },
    'cli.progressBars': {
      type: 'bool',
      default: true,
    },
    'cli.progressInterval': {
      type: 'string',
      default: 250,
    },
    'cli.timestamp': {
      type: 'bool',
      default: false,
    },
    'json.pretty': {
      type: 'bool',
      default: false,
    },
    'log.file': {
      type: 'string',
      default: '',
    },
    'log.level': {
      type: 'choice',
      default: 'info',
      choices: [
        'info',
        'verbose',
        'debug',
        'silly',
      ],
    },
  };

let configFile = `${Command.getConfigDirectory()}/config.json`;
if (yargs.argv['c'] || yargs.argv['config']) {
  configFile = yargs.argv['c'] || yargs.argv['config'];
}

if (yargs.argv['cache']) {
  Command.CACHE_DIR = yargs.argv['cache'];
}

let config = new Config(configFile, appConfig);
if (!config.get('cli.colors')) {
  chalk.enabled = false;
}

Logger.getInstance({
  file: config.get('log.file'),
  logLevel: config.get('log.level'),
  verbosity: 'warn',
  cliTimestamp: config.get('cli.timestamp'),
  colorize: config.get('cli.colors'),
});

async.forEachOfSeries(cliConfig.commands, (command, name, callback) => {
  yargs.command(name, command.desc, yargs => {
    return yargs.usage(`${command.desc}\n\n${chalk.magenta('Usage:')}\n  ${name} ${command.usage}`)
      .options(command.options)
      .options(cliConfig.global.options)
      .demand(command.demand || 0)
      .strict()
      .fail(message => {
        yargs.showHelp();
        Logger.error(message);
        Command.shutdown(1);
      });
  }, argv => {
    let cliVerbosity = 'info';
    switch (parseInt(argv.verbose)) {
      case 1:
        cliVerbosity = 'verbose';
        break;
      case 2:
        cliVerbosity = 'debug';
        break;
      case 3:
        cliVerbosity = 'silly';
        break;
      default:
        break;
    }

    if (argv.quiet) {
      cliVerbosity = 'error';
    }

    Logger.setConsoleLevel(cliVerbosity);

    // Load in the command file and run
    if (command.file) {
      let Cmd = require(command.file);
      new Cmd({}, config).execute(argv._.slice(1), argv);
    } else if (command.callback) {
      // Otherwise,
      command.callback(code => {
        Command.shutdown(code);
      });
    } else {
      Logger.error(`Command '${name}' does not have a valid config action`);
      Command.shutdown(1);
    }
  });

  callback();
}, err => {
  if (err) {
    Logger.error(err);
    Command.shutdown(1);
  }

  let argv = yargs
    .usage(`${chalk.cyan(banner)}
${chalk.cyan('what')} version ${chalk.magenta(pkgJson.version)}

${chalk.magenta('Usage:')}
  what command [flags] [options] [arguments]`)
    .version(function() {
      return `v${pkgJson.version}`;
    })
    .help('h')
    .alias('h', 'help')
    .alias('V', 'version')
    .updateStrings({
      'Commands:': chalk.magenta('Commands:'),
      'Flags:': chalk.magenta('Flags:'),
      'Options:': chalk.magenta('Options:'),
      'Global Flags:': chalk.magenta('Global Flags:'),
    })
    .options(cliConfig.global.options)
    .strict()
    .fail((message) => {
      yargs.showHelp();
      Logger.error(message);
      Command.shutdown(1);
    })
    .recommendCommands()
    .argv;

  if (!argv._[0]) {
    yargs.showHelp();
  } else {
    if (!cliConfig.commands[argv._[0]]) {
      yargs.showHelp();
      Command.shutdown(1);
    }
  }
});
