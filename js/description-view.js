/* Description View
 *
 * Handles the display of a video item description
 * Creates a new view every time
 */

(function(exports) {
  "use strict";

  //global constants
  var ID_DESCRIPTION_TITLE = "descriptionTitle",
    ID_DESCRIPTION_DATE = "descriptionDate",
    ID_DESCRIPTION_TEXT = "descriptionText";

  /**
   * @class DescView
   * @desc The Description view object, this handles a video item description
   */
  var DescView = function() {

    // mixin inheritance, initialize this as an event handler for these events;
    Events.call(this, ['loadComplete', 'exit', 'bounce']);

    // jquery global variables
    this.$parentEle = null;
    this.$el = null;
    this.el = null;

    /**
     * Removes the main content view dom
     */
    this.remove = function() {
      // remove this element from the dom
      if(this.$el) {
          this.$el.remove();
      }
    };

    /**
     * Hides the desc view
     */
    this.hide = function() {
      this.$el.hide();
    };

    /**
     * Shows the desc view
     */
    this.show = function() {
      this.$el.show();
    };

    /**
     * Creates the description view and attaches it to the application container
     * @param {Element} $el application container
     * @param {Object} data object for the description
     */
    this.render = function(el, data) {
      this.remove();

      this.parentContainer = el;
      // Build the main content template and add it
      var html = utils.buildTemplate($("#description-template"), {
        title: data.title,
        seconds: this.parseTime(data.seconds),
        text: data.description
      });

      el.append(html);
      this.$el = el.children().last();

      //hide the element until we are done with layout
      this.$el.hide();
    };

    this.handleControls = function(e) {
      if (e.type === 'buttonpress') {
        switch (e.keyCode) {
          case buttons.BACK:
            this.trigger("exit");
            break;
        }
      }
    };

    // Convert seconds to HH:MM:SS
    this.parseTime = function(totalSec) {
      var hours = parseInt(totalSec / 3600) % 24;
      var minutes = parseInt(totalSec / 60) % 60;
      var seconds = totalSec % 60;

      return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

  };

  exports.DescView = DescView;
}(window));
