'use strict';

var Command = require('./Command'),
  Logger = require('../Logger'),
  Utils = require('../Utils'),
  async = require('async'),
  request = require('request'),
  cheerio = require('cheerio'),
  webshot = require('webshot'),
  url = require('url');

class ScreenshotCommand extends Command {
  run(args, options) {
    return new Promise((resolve, reject) => {
      let username = options.username || this.config.get('user.name'),
        password = options.password || this.config.get('user.password'),
        userId = options['user-id'] || this.config.get('user.id'),
        host = Utils.trimPath(options.host || this.config.get('host')),
        saveDir = Utils.trimPath(options['save-directory'] || this.config.get('dir.screenshots')),
        items = [
          {
            url: `${host}/user.php?id=${userId}`,
            name: `${url.parse(host).hostname}-profile`,
          },
          {
            url: `${host}/index.php`,
            name: `${url.parse(host).hostname}-homepage`,
          },
        ];

      if (options.url && options.name) {
        items = [
          {
            url: options.url,
            name: options.name,
          }
        ];
      }

      if (!username) {
        return reject(Error('Username is not specified'));
      }

      if (!password) {
        return reject(Error('Password is not specified'));
      }

      if (!host) {
        return reject(Error('Host is not specified'));
      }

      if (!saveDir) {
        return reject(Error('Save directory is not specified'));
      }

      request = request.defaults({jar: request.jar()});

      Logger.info('Logging in...');
      request.post(`${host}/login.php`, {
        form: {
          username: username,
          password: password,
        }
      }, (err, response, data) => {
        if (err) {
          return Logger.info(err);
        }

        Logger.info('Successfully logged in');

        async.waterfall([
          // PTP screenshots
          callback => {
            request.get(`${host}/user.php?id=${userId}`, {}, (err, response, body) => {
              if (err) {
                return callback(err);
              }

              let $ = cheerio.load(body);

              async.forEach(items, (item, callback) => {
                Logger.info(`Taking ${item.name} screenshot...`);
                webshot(item.url, `${saveDir}/${item.name}-${Date.now()}.png`, {
                  customHeaders: {
                    Cookie: response.request.headers.cookie,
                  },
                  windowSize: {
                    width: 1905,
                    height: 3892,
                  },
                }, err => {
                  if (err) {
                    return callback(err);
                  }

                  Logger.info(`Sucessfully saved ${item.name} screenshot to ${saveDir}`);
                });
              }, err => {
                return callback(err);
              });
            });
          },
        ], err => {
          if (err) {
            return reject(err);
          }

          return resolve();
        });
      });
    });
  }
}

module.exports = ScreenshotCommand;
