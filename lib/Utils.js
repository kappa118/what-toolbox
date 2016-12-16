'use strict';

let fs = require('fs'),
  crypto = require('crypto');

class Utils {
  static arrayUnique(xary) {
    xary = xary.sort(function(a, b) {
      return a * 1 - b * 1;
    });

    let retval = [xary[0]];
    // Start loop at 1 as element 0 can never be a duplicate
    for (var i = 1; i < xary.length; i++) {
      if (xary[i - 1] !== xary[i]) {
        retval.push(xary[i]);
      }
    }

    return retval;
  }

  static getPathArray(path) {
    let retval = [];
    path = path.split('/');
    for (let i = 0; i < path.length; i++) {
      if (path[i]) {
        retval.push(path[i]);
      }
    }

    return retval;
  }

  static pad(string, length, side) {
    if (!side) {
      side = 'right';
    }

    switch (side) {
      case 'left':
        return (string.toString().length < length) ? Utils.pad(` ${string}`, length, side) : string;
      default:
        return (string.toString().length < length) ? Utils.pad(`${string} `, length, side) : string;
    }
  }

  static trimPath(string) {
    while (string.charAt(string.length - 1) === '/') {
      string = string.substring(0, string.length - 1);
    }

    return string;
  }
}

module.exports = Utils;
