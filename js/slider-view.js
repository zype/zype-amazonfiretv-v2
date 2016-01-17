/**
 *
 * Slider View
 *
 */

(function(exports) {
  "use strict;"

  var SLIDER_ROW_ITEM_SELECTED = "slider-rowitem-selected";

  /**
   * @class SliderView
   * @description The slider view object, this handles everything about the slider
   */
  var SliderView = function() {
    // mixins
    Events.call(this, ['loadComplete', 'exit', 'bounce', 'startScroll', 'indexChange', 'stopScroll', 'select']);

    // gloval variables
    this.currSelection = 0;

    // global jquery variables
    this.$parentEle = null;
    this.$el = null;
    this.$rowElements = null;
    this.rowsData = null;

    /**
     * Removes the main view dom
     */
    this.remove = function() {
      // remove this element from the dom
      this.$el.remove();
    };

    /**
     * Hides the slider view
     */
    this.hide = function() {
      this.$el.hide();
    };

    /**
     * Shows the slider view
     */
    this.show = function() {
      this.$el.show();
    };

    /**
     * Creates the slider view
     */
    this.render = function(el, row) {
      this.parentContainer = el;
    }
  };

  exports.SliderView = SliderView;
}(window));
