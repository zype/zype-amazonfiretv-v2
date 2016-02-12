/**
 * Device Linking View
 *
 * Handles the display of Device Linking page with PIN
 */
(function(exports) {
  "use strict";

  /**
   * @class DeviceLinkingView
   * @description The view that shows the Device Linking PIN
   * when a user does link they will be sent back to the content
   */
  var DeviceLinkingView = function() {
    // mixin inheritance
    Events.call(this, ['exit', 'loadComplete', 'linkingSuccess', 'linkingFailure']);

    // global vars
    this.timer = null;

    // jquery global vars
    this.$el = null;

    // hide this view
    this.hide = function() {
      this.$el.hide();
    };

    // show this view
    this.show = function() {
      this.$el.show();
    };

    // remove this view
    this.remove = function() {
      if (this.$el) {
        $(this.$el).remove();
      }
    };

    /**
     * Creates the device linking view and attaches it to the application container
     * @param {Element} $el application container
     * @param {String} PIN
     */
    this.render = function($el) {
      // Make sure we do not already have a full container
      this.remove();

      deviceLinkingHandler.acquirePin(app.settingsParams.device_id, function(pin) {
        // Build the main content template and add it
        var html = utils.buildTemplate($("#device-linking-view-template"), {
          link: app.settingsParams.linking_url,
          pin: pin
        });

        $el.append(html);
        this.$el = $el.children().last();

        this.statusWatch();
        this.trigger('loadComplete');
      }.bind(this));
    }.bind(this);

    this.statusWatch = function() {
      var counter = 0;
      this.timer = setInterval(function() {
        console.log('pin.status.check');
        deviceLinkingHandler.isLinked(app.settingsParams.device_id, function(res) {
          if (res === true) {
            clearInterval(this.timer);
            this.trigger("linkingSuccess");
          }
        }.bind(this));

        counter++;
        if (counter === 360) {
          clearInterval(this.timer);
          this.trigger("linkingFailure");
        }
      }.bind(this), 5000);
    };

    // key event handler
    this.handleControls = function(e) {
      if (e.type === "buttonpress") {
        switch (e.keyCode) {
          case buttons.BACK:
            clearInterval(this.timer);
            this.trigger('exit');
            break;
          default:
            break;
        }
      }
    }.bind(this);
  };

  exports.DeviceLinkingView = DeviceLinkingView;
}(window));
