'use strict';

let Command = require('./Command'),
  Logger = require('../Logger'),
  Utils = require('../Utils'),
  request = require('request'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  url = require('url'),
  async = require('async');

class DownloadReleaseInfoCommand extends Command {
  run(args, options) {
    return new Promise((resolve, reject) => {
      let username = options.username || this.config.get('user:name'),
        password = options.password || this.config.get('user:password'),
        userId = options['user-id'] || this.config.get('user:id'),
        seedDir = Utils.trimPath(options['seed-directory'] || this.config.get('dir:seeds')),
        host = Utils.trimPath(options.host || this.config.get('host'));

        if (!username) {
          return reject(Error('Username is not specified'));
        }

        if (!password) {
          return reject(Error('Password is not specified'));
        }

        if (!host) {
          return reject(Error('Host is not specified'));
        }

        if (!seedDir) {
          return reject(Error('Seeds directory is not specified'));
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

        let page = 1,
          processedDirectories = [],
          $ = null;
        async.doWhilst(
          callback => {
            Logger.info(`Fetching page ${page}`);
            request.get(`${host}/torrents.php?page=${page}&type=seeding&userid=${userId}&search=&bitrate=&format=&media=&releasetype=&log=&cue=&scene=&vanityhouse=&tags=&tags_type=1&order=Name&way=ASC`, {}, (err, response, data) => {
              $ = cheerio.load(data);
              async.forEachOf($('.torrent.torrent_row'), (el, index, callback) => {
                let $el = $(el),
                  releaseUrl = null;
                for (let i = 0; i < $el.find('.group_info > a').length; i++) {
                  if ($($el.find('.group_info > a')[i]).attr('href').match(/torrents\.php/)) {
                    releaseUrl = $($el.find('.group_info > a')[i]).attr('href');
                    break;
                  }
                }

                if (!releaseUrl) {
                  Logger.error(`No release URL found for item ${index}. Skipping.`);
                  return callback();
                }

                let [trash, torrent, torrentId] = releaseUrl.match(/\?id=(\d+)&torrentid=(\d+)/);

                Logger.info(`Fetching torrent ${torrent} with ID ${torrentId} from ${releaseUrl}`);
                request.get(`${host}/${releaseUrl}`, {}, (err, response, data) => {
                  if (err) {
                    return callback(err);
                  }

                  let $ = cheerio.load(data),
                    albumArtistInfo = $('div.header h2').first().text(),
                    releaseElement = $(`#torrent${torrentId}`).first(),
                    edition = releaseElement.attr('class').match(/edition_(\d+)/)[1],
                    editionElement = $($('tr.edition')[parseInt(edition) - 1]),
                    quality = $(releaseElement.find('td > a')[0]).text().replace(' / Snatched!', ''),
                    directoryName = $(`#torrent_${torrentId}`).find('.filelist_path').first().text();

                  if (!editionElement.html()) {
                    Logger.error(`Invalid edition information found for ${releaseUrl} (edition ${edition})`);
                    return callback();
                  }

                  let releaseString = `${albumArtistInfo}\n${editionElement.html().match(/<\/a>(.+?)<\/strong>/)[1].trim()}\n${quality}\n`;

                  if (processedDirectories.includes(directoryName)) {
                    Logger.error(`Already processed directory ${directoryName}. You may have multiple torrents in one folder.`);
                    return callback();
                  }

                  processedDirectories.push(directoryName);

                  Logger.info(`Finding release information for ${albumArtistInfo} (edition ${edition}) (directory: ${directoryName})...`);

                  try {
                    fs.statSync(`${seedDir}${directoryName}`);
                  } catch(e) {
                    Logger.error(`Directory ${seedDir}${directoryName} doesn't exist.`);
                    return callback();
                  }

                  if (!options.force) {
                    try {
                      fs.statSync(`${seedDir}${directoryName}${url.parse(host).hostname}-release.nfo`);
                      Logger.warn(`Release file already exists. Skipping.`);
                      return callback();
                    } catch (e) {}
                  }

                  Logger.info(`Writing release information to ${seedDir}${directoryName}`);

                  fs.writeFile(`${seedDir}${directoryName}${url.parse(host).hostname}-release.nfo`, releaseString, err => {
                    return callback(err);
                  });
                });
              }, err => {
                page++;
                return callback(err);
              });
            });
          },
          () => {
            return $('.pager_next').length > 0;
          },
          err => {
            if (err) {
              return reject(err);
            }

            return resolve();
          }
        );
      });
    });
  }
}

module.exports = DownloadReleaseInfoCommand;
