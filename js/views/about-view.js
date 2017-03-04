/*About View
 *
 * Handles the display of the app's About page
 * Creates a new view every time
 */

(function(exports) {
  "use strict";

  // global constants
  var ID_ABOUT_TEXT = 'aboutText';

  /**
   * @class AboutView
   * @desc The About view object, this handles the app's About page
   */
  var AboutView = function() {

    // mixin inheritance, initialize this as an event handler for these events;
    Events.call(this, ['exit', 'bounce']);

    // jquery global variables
    this.$parentEle = null;
    this.$el = null;
    this.el = null;

    /**
     * Removes the element from dom
     */
    this.remove = function() {
      if (this.$el) {
        this.$el.remove();
      }
    };

    /**
     * Hides the desc view
     */
    this.hide = function() {
      console.log('about.hide()');
      this.$el.hide();
    };

    /**
     * Shows the desc view
     */
    this.show = function() {
      console.log('about.show()');
      this.$el.show();
    };

    /**
     * Creates the About view and attaches it to the application container
     * @param {Element} $el  application container
     * @param {String}  data object for the About
     */
    this.render = function(el, data) {
      // Build the main content template and add it
      var html = utils.buildTemplate($("#about-template"), {
        text: data
      });

      el.append(html);
      this.$el = el.children().last();

      // hide the element until we are done with layout
      this.hide();
    };

    this.handleControls = function(e) {
      if (e.type === 'buttonpress') {
        switch (e.keyCode) {
          default: this.trigger('bounce');
        }
      }
    };

  };

  exports.AboutView = AboutView;
}(window));
