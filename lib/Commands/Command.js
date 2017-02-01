'use strict';

let path = require('path'),
  fs = require('fs-extra'),
  ParameterBag = require('../ParameterBag'),
  Utils = require('../Utils'),
  Logger = require('../Logger'),
  chalk = require('chalk'),
  elegantSpinner = require('elegant-spinner'),
  envPaths = require('env-paths'),
  logUpdate = require('log-update'),
  paths = null,
  spinner = null,
  spinnerText = '';

class Command {
  constructor(config = {}, appConfig = {}) {
    if (Command.APP_NAME === null) {
      throw Error('No app name set');
    }

    this.params = {};

    for (let key in config) {
      if (this.params[key] === undefined) {
        continue;
      }

      this.params[key] = config[key];
    }

    if (appConfig.constructor.name !== 'Config') {
      throw Error(`Second parameter must be an instance of 'Config'.`);
    }

    this.config = appConfig;
  }

  execute(args, options) {
    try {
      Logger.debug(`Running ${this.constructor.name}`);
      this.run.apply(this, arguments)
        .then(() => {
          Command.shutdown(0);
        }, err => {
          if (err) {
            switch (err.code) {
              case 'ENOTFOUND':
                Logger.error(`Unable to connect. Please make sure you have network access: ${err}`);
                break;
              default:
                Logger.error(`${err}`);
            }
          }
          Command.shutdown(1);
        });
    } catch (err) {
      if (err) {
        Logger.error(`Uncaught error: ${err}`);
      }
      Command.shutdown(1);
    }
  }

  run(cmd, options) {

  }

  static getAppName() {
    return Command.APP_NAME;
  }

  static getCacheDirectory() {
    if (Command.APP_NAME === null) {
      throw Error('No app name set');
    }

    try {
      fs.statSync(paths.cache);
    } catch (e) {
      fs.mkdirsSync(paths.cache);
    }

    return paths.cache;
  }

  static getConfigDirectory() {
    if (Command.APP_NAME === null) {
      throw Error('No app name set');
    }

    try {
      fs.statSync(paths.config);
    } catch (e) {
      fs.mkdirsSync(paths.config);
    }

    return paths.config;
  }

  static getLogDirectory() {
    if (Command.APP_NAME === null) {
      throw Error('No app name set');
    }

    try {
      fs.statSync(paths.log);
    } catch (e) {
      fs.mkdirsSync(paths.log);
    }

    return paths.log;
  }

  static getTempDirectory() {
    if (Command.APP_NAME === null) {
      throw Error('No app name set');
    }

    try {
      fs.statSync(paths.temp);
    } catch (e) {
      fs.mkdirsSync(paths.temp);
    }

    return paths.temp;
  }

  static setAppName(name) {
    Command.APP_NAME = name;
    paths = envPaths(name);
  }

  static shutdown(code) {
    if (code === undefined) {
      code = 0;
    }

    Logger.debug(`Exiting with code ${code}`);
    Logger.flushAndExit(code);
  }

  static startSpinner(message, verbosity) {
    if (Logger.getOutputLevel() !== 'info') {
      return;
    }

    spinnerText = message || '';

    let frame = elegantSpinner();
    logUpdate.done();
    spinner = setInterval(() => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(spinnerText + chalk.bold.cyan(frame()));
    }, 50);
  }

  static updateSpinnerText(message) {
    spinnerText = message || '';
  }

  static stopSpinner(message) {
    if (spinner) {
      clearInterval(spinner);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      if (message) {
        console.log(message);
      }
    }
  }
}

Command.APP_NAME = null;
Command.SORT_BY_NAME = 'name';
Command.SORT_BY_DATE = 'date';
Command.VERBOSE_LEVEL = 0;

module.exports = Command;
