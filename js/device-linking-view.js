/**
 * Device Linking View
 *
 * Handles the display of Device Linking page with PIN
 */
(function(exports) {
  "use strict";

  var ID_DEVICE_LINKING_CONTAINER = "device-linking-buttons";

  /**
   * @class DeviceLinkingView
   * @description The view that shows the Device Linking PIN
   * when a user does link they will be sent back to the content
   */
  var DeviceLinkingView = function() {
    // mixin inheritance
    Events.call(this, ['exit', 'loadComplete', 'linkingSuccess', 'linkingFailure', 'browse', 'startBrowse']);

    // global vars
    this.timer = null;
    this.$buttonsContainer = null;
    this.currentView = null;

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

    this.on("startBrowse", function() {
      clearInterval(this.timer);
    }, this);

    /**
     * Maintain the current view for event handling
     */
    this.setCurrentView = function(view) {
      this.currentView = view;
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
          link: app.settingsParams.device_link_url,
          pin: pin
        });

        $el.append(html);
        this.$el = $el.children().last();

        var displayButtons = true; // we can change this if we need to do so
        this.createButtonView(displayButtons, this.$el);

        this.statusWatch();
        this.trigger('loadComplete');
      }.bind(this));
    }.bind(this);

    this.createButtonView = function(displayButtonsParam, $el) {
      this.$buttonsContainer = $el.children("#" + ID_DEVICE_LINKING_CONTAINER);
      var buttonView = this.buttonView = new ButtonView();

      buttonView.on('exit', function() {
        this.trigger("exit");
      }, this);

      buttonView.on("browse", function() {
        this.trigger("startBrowse");
      }, this);

      buttonView.update = function() {
        var buttons = [{
          "name": "Browse Content",
          "id": "browseBtn",
          "class": "btnBrowse"
        }];
        this.buttonView.render(this.$buttonsContainer, buttons);
      }.bind(this);

      this.buttonView.update();
    };

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

    this.transitionToButtonView = function() {
      this.setCurrentView(this.buttonView);

      //set default selected button and apply selected style
      this.buttonView.setCurrentSelectedIndex(0);
      this.buttonView.setSelectedButton();
    };

    // key event handler
    this.handleControls = function(e) {
      var dirty = false;

      if (e.type === "buttonpress") {
        switch (e.keyCode) {
          case buttons.UP:
            break;
          case buttons.BACK:
            clearInterval(this.timer);
            this.trigger('exit');
            dirty = true;
            break;
          case buttons.DOWN:
            this.transitionToButtonView();
            dirty = true;
            break;
        }
      }

      //use the dirty flag to make sure we are not handling the
      //event twice - once for this view and once in the child view
      if (!dirty && this.currentView) {
        this.currentView.handleControls(e);
      }
    }.bind(this);
  };

  exports.DeviceLinkingView = DeviceLinkingView;
}(window));
