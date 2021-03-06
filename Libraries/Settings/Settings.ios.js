/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Settings
 * @flow
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTSettingsManager = require('NativeModules').SettingsManager;

var invariant = require('invariant');

var subscriptions: Array<{keys: Array<string>; callback: ?Function}> = [];

var Settings = {
  _settings: RCTSettingsManager.settings,

  get(key: string): mixed {
    return this._settings[key];
  },

  set(settings: Object) {
    this._settings = Object.assign(this._settings, settings);
    RCTSettingsManager.setValues(settings);
  },

  watchKeys(keys: string | Array<string>, callback: Function): number {
    if (typeof keys == 'string') {
      keys = [keys];
    }

    invariant(
      Array.isArray(keys),
      'keys should be a string or array of strings'
    );

    var sid = subscriptions.length;
    subscriptions.push({keys: keys, callback: callback})
    return sid;
  },

  clearWatch(watchId: number) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {keys: [], callback: null};
    }
  },

  _sendObservations(body: Object) {
    var _this = this;
    Object.keys(body).forEach((key) => {
      var newValue = body[key];
      var didChange = _this._settings[key] !== newValue;
      _this._settings[key] = newValue;

      if (didChange) {
        subscriptions.forEach((sub) => {
          if (~sub.keys.indexOf(key) && sub.callback) {
            sub.callback();
          }
        });
      }
    });
  },
};

RCTDeviceEventEmitter.addListener(
  'settingsUpdated',
  Settings._sendObservations.bind(Settings)
);

module.exports = Settings;
