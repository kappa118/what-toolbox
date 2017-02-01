'use strict';

let Command = require('./GazelleCommand'),
  Logger = require('../Logger'),
  Utils = require('../Utils'),
  url = require('url'),
  async = require('async'),
  fs = require('fs-extra'),
  inquirer = require('inquirer');

class SnatchFreeleechCommand extends Command {
  run(args, options) {
    return new Promise((resolve, reject) => {
      this.username = options.username || this.config.get('user.name');
      this.password = options.password || this.config.get('user.password');
      this.userId = options['user-id'] || this.config.get('user.id');
      this.torrentDir = Utils.trimPath(options['torrents-directory'] || this.config.get('dir.torrents'));
      this.host = Utils.trimPath(options.host || this.config.get('host'));
      this.dryRun = options['dry-run'];

      if (!this.username) {
        return reject(Error('Username is not specified'));
      }

      if (!this.password) {
        return reject(Error('Password is not specified'));
      }

      if (!this.host) {
        return reject(Error('Host is not specified'));
      }

      if (!this.torrentDir) {
        return reject(Error('Torrent directory is not specified'));
      }

      try {
        fs.statSync(`${Command.getCacheDirectory()}/${url.parse(this.host).hostname}.freeleech.cache`);
        this.freeleechCache = JSON.parse(fs.readFileSync(`${Command.getCacheDirectory()}/${url.parse(this.host).hostname}.freeleech.cache`));
      } catch (e) {
        this.freeleechCache = {};
      }

      this.newCache = {};

      this.login(this.username, this.password, err => {
        if (err) {
          return reject(err);
        }

        this.updateUserInfo(err => {
          if (err) {
            return reject(err);
          }

          if ((this.userData.userstats.uploaded / this.userData.userstats.downloaded) <= this.userData.userstats.requiredratio) {
            return reject(Error(`User ratio is too low. Exiting.`));
          }

          let minRatio = this.config.get('snatch.minRatio');
          if (minRatio && (this.userData.userstats.uploaded / this.userData.userstats.downloaded) <= minRatio) {
            return reject(Error(`User's ratio is less than or equal to minimum (${minRatio}). Exiting.`));
          }

          Logger.info('Fetching current freeleeches...');

          let page = 1,
            totalPages = null;
          async.doWhilst(
            callback => {
              Logger.info(`Fetching page ${page} (${this.host}/ajax.php?action=browse&freetorrent=1&page=${page})`);
              this.request.get(`${this.host}/ajax.php?action=browse&freetorrent=1&order_by=time&order_way=desc&page=${page}`, (err, response, data) => {
                if (err) {
                  return callback(err);
                }

                try {
                  data = JSON.parse(data);
                  if (!data || data.status !== 'success') {
                    return callback(Error(`Failed to retrieve freeleeches.`));
                  }
                } catch (e) {
                  return callback(Error(`Unable to parse API response from body: ${JSON.stringify(response)}`));
                }

                if (!totalPages) {
                  totalPages = data.response.pages;
                }

                page++;

                async.forEachSeries(data.response.results, (item, callback) => {
                  Logger.info(`${item.artist} - ${item.groupName}`);
                  async.forEachSeries(item.torrents, (torrent, callback) => {
                    this.downloadTorrent(torrent, callback);
                  }, err => {
                    return callback(err);
                  });
                }, err => {
                  return callback(err);
                });
              });
            },
            () => {
              return page <= totalPages;
            },
            err => {
              if (err) {
                return reject(err);
              }

              Logger.info('Torrents that are no longer freeleech: ');
              for (let id in this.freeleechCache) {
                Logger.info(`  ${id}`);
              }

              fs.writeFileSync(`${Command.getCacheDirectory()}/${url.parse(this.host).hostname}.freeleech.cache`, JSON.stringify(this.newCache));

              return resolve();
            }
          );
        });
      });
    });
  }

  downloadTorrent(item, callback) {
    this.newCache[item.torrentId] = item;

    if (this.freeleechCache[item.torrentId]) {
      Logger.verbose(`  Skipping torrent ${item.torrentId}. Was previously retrieved.`);
      delete(this.freeleechCache[item.torrentId]);
      return callback();
    }

    let formats = {},
      formatDefaults = {
        'FLAC': {
          'format': 'FLAC',
          'encoding': 'Lossless'
        },
        'V0': {
          'format': 'MP3',
          'encoding': 'V0 (VBR)'
        },
        '320': {
          'format': 'MP3',
          'encoding': '320'
        },
        'V2': {
          'format': 'MP3',
          'encoding': 'V2 (VBR)'
        },
      };

    if (this.config.get('snatch.formats')) {
      for (let format of this.config.get('snatch.formats')) {
        formats[format.toUpperCase()] = formatDefaults[format.toUpperCase()];
      }
    } else {
      formats = formatDefaults;
    }

    let validFormat = false;
    for (let format in formats) {
      if (item.format !== formats[format].format || item.encoding !== formats[format].encoding) {
        continue;
      }

      validFormat = true;
    }

    if (!validFormat) {
      Logger.verbose(`  Skipping torrent ${item.torrentId}. Invalid format ${item.format} - ${item.encoding}`);

      return callback();
    }

    if (this.dryRun) {
      Logger.info(`  Dry run. Skipping torrent ${item.torrentId}.`);

      return callback();
    }

    // Download torrent file here
    let filename = `${item.torrentId}.torrent`;
    Logger.info(`  Downloading torrent ${item.torrentId} with format ${item.format} - ${item.encoding}`);
    this.request
      .get(`${this.host}/torrents.php?action=download&id=${item.torrentId}&authkey=${this.userData.authkey}&torrent_pass=${this.userData.passkey}`)
      .on('response', function(response) {
        filename = response.headers['content-disposition'].match(/="(.+?\.torrent)"/)[1];
      })
      .pipe(fs.createWriteStream(`${Command.getTempDirectory()}/${item.torrentId}.torrent`))
      .on('finish', err => {
        fs.renameSync(`${Command.getTempDirectory()}/${item.torrentId}.torrent`, `${this.torrentDir}/${filename}`);

        return callback(err);
      });
  }
}

module.exports = SnatchFreeleechCommand;
