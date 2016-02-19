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
      this.acquirePin(device_id, function(result) {
        if (result !== false && result.linked !== false) {
          callback(true);
        } else {
          callback(false);
        }
      });
    };

    // can play video?
    this.canPlayVideo = function() {
      if (this.settingsParams.device_linking) {
        if (this.settingsParams.linked) {
          return true;
        }
        return false;
      }
      return true;
    };

    // generate UUID
    this.generateUuid = function() {
      var device_id = uuid.v4();
      return device_id;
    };

    // remove Device ID. Removes everything from the localstorage
    this.removeDeviceId = function() {
      store.clear();
    };

    // get Device ID
    this.getDeviceId = function() {
      var unique_id = store.get('device_id');
      if (unique_id) {
        return unique_id;
      }
      return null;
    };

    // set Device ID
    this.setDeviceId = function() {
      var unique_id = this.generateUuid();
      store.set('device_id', unique_id);
      return unique_id;
    };
  };

  exports.DeviceLinking = DeviceLinking;
  exports.deviceLinkingHandler = new DeviceLinking();
}(window));
