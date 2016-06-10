/* Device Linking Utility
 *
 * Handles Device Linking
 *
 */

(function(exports) {
  "use strict";

  var DeviceLinking = function(settings) {
    // make it a singleton
    if (exports.deviceLinkingHandler) {
      return deviceLinkingHandler;
    }

    // global variables
    this.settingsParams = settings;

    // acquire PIN for a device
    // POST - https://api.zype.com/pin/acquire/?linked_device_id=linked_device_id&type=type
    this.acquirePin = function(device_id, callback) {
      var resp = null;
      $.ajax({
        url: this.settingsParams.endpoint + "pin/acquire/?linked_device_id=" + device_id + "&type=aftv&app_key=" + this.settingsParams.app_key,
        type: 'POST',
        crossDomain: true,
        context: this,
        cache: false,
        success: function(result) {
          resp = result.response;
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('pin.acquire.error');
          resp = false;
        },
        complete: function() {
          callback(resp);
        }
      });
    };

    this.getPin = function(device_id, callback) {
      this.acquirePin(device_id, function(result) {
        if (result !== false) {
          callback(result.pin);
        } else {
          alert("There was an error configuring your Fire TV App. Please exit.");
          app.exit();
        }
      });
    };

    // GET - https://api.zype.com/pin/status/?linked_device_id=linked_device_id
    this.pinStatus = function(device_id, callback) {
      var resp = null;
      $.ajax({
        url: this.settingsParams.endpoint + "pin/status/?linked_device_id=" + device_id + "&app_key=" + this.settingsParams.app_key,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        success: function(result) {
          resp = result.response;
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('pin.status.error');
          resp = false;
        },
        complete: function() {
          callback(resp);
        }
      });
    };

    this.getPinStatus = function(device_id, callback) {
      this.pinStatus(device_id, function(result) {
        if (result !== false && result.linked !== false) {
          console.log('Success: getPinStatus');
          callback(result);
        } else {
          console.log('Fail: getPinStatus');
          callback(false);
        }
      });
    };

    this.retrieveAccessToken = function(device_id, pin, callback) {
      var resp = null;

      $.ajax({
        url: 'https://login.zype.com/oauth/token/',
        type: 'POST',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        data: {
          'client_id' : this.settingsParams.client_id,
          'client_secret' : this.settingsParams.client_secret,
          'linked_device_id' : device_id,
          'pin' : pin,
          'grant_type' : 'password'
        },
        success: function(result) {
          console.log('Success: retrieveAccessToken');
          resp = result;
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('Error: retrieveAccessToken');
          resp = false;
        },
        complete: function() {
          callback(resp);
        }
      });
    };

    this.retrieveAccessTokenStatus = function(access_token) {
      var resp = null;

      $.ajax({
        url: 'https://login.zype.com/oauth/token/info/',
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        data: {
          'access_token' : access_token
        },
        success: function(result) {
          console.log('retrieveAccessTokenStatus', result);
          resp = result;
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('Error: retrieveAccessTokenStatus', xhr);
        },
        complete: function() {
          return resp;
        }
      });
    };

    this.refreshAccessToken = function(client_id, client_secret, refresh_token, callback) {
      var resp = null;

      $.ajax({
        url: this.settingsParams.endpoint + "oauth/token/",
        type: 'POST',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        data: {
          'client_id' : this.settingsParams.client_id,
          'client_secret' : this.settingsParams.client_secret,
          'refresh_token' : refresh_token,
          'grant_type' : 'refresh_token'
        },
        success: function(result) {
          console.log("refreshAccessToken success");
          resp = result;
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('Error - refreshingAccessToken', xhr);
          resp = false;
        },
        complete: function() {
          callback(resp);
        }
      });
    };

    // Determine if stored Access Token is valid
    this.hasValidAccessToken = function() {
      var date = Date.now();
      var oauth = this.getOauthData();

      if (oauth.created_at && oauth.expires_in) {
        var delta = (date / 1000) - oauth.created_at;
        if (oauth.expires_in > delta) {
          return true;
        }
        console.log("Error: OAuth data expired");
        return false;
      }
      console.log("Error: no stored OAuth data");
      return false;
    };

    // Determine if video is playable
    this.canPlayVideo = function() {
      // Not Device Linking
      if (!this.settingsParams.device_linking) {
        return true;
      }
      // Device Linking + Access Tokens
      if (this.settingsParams.linked === true && this.hasValidAccessToken() === true) {
        return true;
      } 
      // Device not linked or invalid access token
      return false;
    };

    // Determine if user is Entitled
    this.isEntitled = function(video_id, accessToken, callback) {
      $.ajax({
        url: this.settingsParams.endpoint + 'videos/' + video_id + "/entitled/",
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        data: {
          "access_token" : accessToken
        },
        success: function(result, textStatus, xhr){
          console.log('isEntitled == true');
          callback(true);
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log('isEntitled == false || unable to reach verification server');
          callback(false);
        }
      });
    };

    // generate UUID
    this.generateUuid = function() {
      var device_id = uuid.v4();
      return device_id;
    };

    this.getDeviceId = function() {
      var unique_id = store.get('device_id');
      if (unique_id) {
        return unique_id;
      }
      return null;
    };

    this.setDeviceId = function() {
      var unique_id = this.generateUuid();
      store.set('device_id', unique_id);
      return unique_id;
    };

    this.setDevicePin = function(pin) {
      console.log("success setDevicePin", pin);
      store.set('pin', pin);
      return pin;
    };

    this.getDevicePin = function() {
      var pin = store.get('pin');
      console.log('stored pin is:', pin);
      if (pin) {
        return pin;
      }
      return null;
    };

    this.setOauthData = function(oauth) {
      store.set('oauth', {
        access_token: oauth.access_token,
        created_at: oauth.created_at,
        expires_in: oauth.expires_in,
        refresh_token: oauth.refresh_token,
        scope: oauth.scope,
        token_type: oauth.token_type
      });
    };

    this.getOauthData = function() {
      var oauth = store.get('oauth');
      if (oauth) {
        return oauth;
      }
      return null;
    }

    this.getStoredData = function(key, value) {
      var oauth = store.get(key);
      if (oauth.value) {
        return oauth.value;
      }
      return null;
    };

    this.getAccessToken = function() {
      var oauth = store.get('oauth');
      if (oauth.access_token) {
        return oauth.access_token;
      }
      return null;
    };

    this.getRefreshToken = function() {
      var oauth = store.get('oauth');
      if (oauth.refresh_token) {
        return oauth.refresh_token;
      }
      return null;
    }

    // Remove everything from Local Storage
    this.clearLocalStorage = function() {
      console.log('clearLocalStorage triggered');
      store.clear();
    };

  };

  exports.DeviceLinking = DeviceLinking;
  exports.deviceLinkingHandler = new DeviceLinking();
}(window));
