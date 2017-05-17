'use strict';

let Command = require('./Command'),
  Logger = require('../Logger'),
  Utils = require('../Utils'),
  request = require('request');

class GazelleCommand extends Command {
  constructor() {
    super(...arguments);
    this.request = request.defaults({jar: request.jar()});
  }

  login(username, password, callback) {
    Logger.info('Logging in...');
    this.request.post(`${this.host}/login.php`, {
      form: {
        username: this.username,
        password: this.password,
      },
    }, (err, response, data) => {
      if (err) {
        return callback(err);
      }

      if (response.statusCode !== 302) {
        return callback(Error(`Failed to log in. Response: ${data}`));
      }

      Logger.info('Successfully logged in!');

      return callback();
    });
  }

  updateUserInfo(callback) {
    Logger.info(`Fetching user data for user ${this.userId}`);
    this.request.get(`${this.host}/ajax.php?action=index`, (err, response, data) => {
      if (err) {
        return callback(err);
      }

      try {
        data = JSON.parse(data);
        if (data.status !== 'success') {
          return callback(Error('Failed to parse API data.'));
        }
      } catch (e) {
        return callback(Error(`API endpoint did not respond properly. Data: ${data}`));
      }

      this.userData = data.response;

      Logger.info(`${this.userData.username} [${this.userData.userstats.class}] - ${Utils.convertFileSize(this.userData.userstats.uploaded)}/${Utils.convertFileSize(this.userData.userstats.downloaded)} up/down (ratio: ${this.userData.userstats.ratio}, required: ${this.userData.userstats.requiredratio})`);

      return callback(null);
    });
  }
}

module.exports = GazelleCommand;
