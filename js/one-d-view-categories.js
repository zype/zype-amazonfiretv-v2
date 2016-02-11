/* Full Row View
 *
 * Handles 1D view containing one sub-category of elements
 *
 */

(function(exports) {
  "use strict";

  //module constants
  var ID_ONED_VIEW_ELEMENTS = "#one-D-view-item-elements",

    ID_ONED_SLIDER_CONTAINER = "one-D-slider-container",

    ID_ONED_SHOVELER_CONTAINER = "one-D-shoveler-container",

    ID_ONED_DESCRIPTION_CONTAINER = "app-container",

    ID_ONED_SUMMARY_CONTAINER = "one-D-summary-container",

    ID_ONED_SUMMARY_TITLE = "summaryTitle",

    ID_ONED_SUMMARY_DATE = "summaryDate",

    ID_ONED_SUMMARY_DESC = "summaryDesc",

    BUTTON_CONTAINER = "one-D-buttons",

    ID_ONED_TITLE = "one-d-title",

    ID_APP_CONTAINER = "app-container",

    ID_SLIDER_SUMMARY_TITLE = "sliderTitle",

    ID_SLIDER_SUMMARY_DESC = "sliderDesc";

  var TIME_TIMEOUT_DISPLAY_INFO = 350;

  /**
   * @class OneDView
   * @description The 1D view object, this handles everything about the 1D menu.
   */
  var OneDViewCategories = function() {
    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['noContent', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce', 'loadComplete']);

    //global variables
    this.currSelection = 0;
    this.currSliderSelection = 0;
    this.currentView = null;
    this.titleText = "";
    this.$title = null;
    this.slider = null;
    this.$sliderContainer = null;
    this.$sliderContainerOffset = null;
    this.$shovelerContainer = null;
    this.$shovelerContainerOffset = null;
    this.$buttonsContainerOffset = null;
    this.$summaryContainer = null;
    this.$descContainer = null;
    this.$buttonsContainer = null;
    this.noItems = false;
    this.translateAmount = null;
    this.sliderData = null;
    this.sliderLoadComplete = false;
    this.shovelerLoadComplete = false;

    //jquery global variables
    this.$el = null;
    this.el = null;

    this.onPurchaseSuccess = function() {
      this.transitionToShovelerView();
      this.buttonView.hide();
    };

    /**
     * Hide this view - use visibility instead of display
     * so that we don't loose any of our dynamic items
     */
    this.hide = function() {
      this.$el.css('visibility', 'hidden');
      $(".one-d-title-container").css('visibility', 'hidden');
      this.shovelerView.hide();
      $();
      if (this.sliderView !== null) this.sliderView.hide();
    };

    /**
     * Display this view
     */
    this.show = function() {
      this.$el.css('visibility', 'visible');
      $(".one-d-title-container").css('visibility', 'visible');
      this.shovelerView.show();
      $();
      if (this.sliderView !== null) this.sliderView.show();
    };

    /**
     * Remove the oneDView element
     */
    this.remove = function() {
      if (this.$el) {
        $(this.$el).remove();
      }
    };

    /**
     * Maintain the current view for event handling
     */
    this.setCurrentView = function(view) {
      this.currentView = view;
    };

    /**
     * Fetch the currently selected video
     */
    this.currentVideo = function() {
      return this.rowElements[this.currSelection];
    };

    /**
     * Creates the one-d-view and attaches it to the application container
     * @param {Element} $el application container
     * @param {Object} rowData data object for the row
     */
    this.render = function(args) {
      //Make sure we don't already have a full container
      this.remove();

      // set up title
      this.$title = $("#" + ID_ONED_TITLE);
      if (args.title.length > 0) {
        this.titleText = args.title;
      }

      // Build the main content template and add it
      var html = utils.buildTemplate($("#one-D-view-items-template"), {
        title: this.titleText
      });

      args.$el.append(html);

      this.$el = args.$el.children().last();
      this.el = this.$el[0];

      //no results found
      if (args.rowData.length <= 0) {
        $(".one-d-no-items-container").show();
        this.trigger('loadComplete');
        this.trigger("noContent");
        this.noItems = true;
        return;
      }

      this.noItems = false;
      this.rowElements = args.rowData;

      //gather widths of all the row elements
      this.$elementWidths = [];

      $("#" + ID_ONED_SLIDER_CONTAINER).hide(); // we need this for scrolling
      this.createShovelerView(args.rowData);
      this.setCurrentView(this.shovelerView);
    };

    /**
     * Initialize the shoveler subview
     * @param {Object} rowData data for the content items
     */
    this.createShovelerView = function(rowData) {
      // create the shoveler subview
      this.$shovelerContainer = this.$el.children("#" + ID_ONED_SHOVELER_CONTAINER);
      var shovelerView = this.shovelerView = new ShovelerView();

      this.shovelerView.setSelectedElement(app.data.currentNestedCategory);

      this.shovelerView.render(this.$shovelerContainer, rowData);
      this.$shovelerContainerOffset = $(this.$shovelerContainer)[0].getBoundingClientRect().top;

      shovelerView.on('exit', function() {
        this.trigger('exit');
      }, this);

      shovelerView.on('select', function(index) {
        this.currSelection = index;
        this.trigger('select', index, false);
      }, this);

      shovelerView.on('bounce', function(direction) {
        this.trigger('bounce', direction);
      }, this);

      shovelerView.on('startScroll', function(direction) {
        this.hideExtraData();
        this.trigger('startScroll', direction);
      }, this);

      shovelerView.on('stopScroll', function(index) {
        this.currSelection = index;
        this.showExtraData(index);
        this.trigger('stopScroll', index);
      }, this);

      shovelerView.on('indexChange', function(index) {
        this.currSelection = index;
        this.trigger('indexChange', index);
      }, this);

      shovelerView.on('loadComplete', function() {
        this.shovelerLoadComplete = true;
        this.showExtraData();
        if (this.sliderView) {
          if (this.sliderLoadComplete) {
            this.trigger("loadComplete");
          }
        } else {
          this.trigger("loadComplete");
        }
      }, this);
    };

    /**
     * Externally change the index
     */
    this.changeIndex = function(index) {
      this.shovelerView.setSelectedElement(index);
      this.shovelerView.transitionRow();
      this.shovelerView.trigger("stopScroll", this.shovelerView.currSelection);
    };


    /**
     * Make the shoveler the active view
     */
    this.transitionToShovelerView = function() {

      //change to shoveler view
      this.setCurrentView(this.shovelerView);

      //change opacity of the shoveler
      this.shovelerView.unfadeSelected();
      this.shovelerView.setTransforms();
    };

    /**
     * Return to selected shoveler and slider state
     */
    this.transition = function() {
      this.shovelerView.unfadeSelected();
      this.slider.unfadeSelected();
    };

    /**
     * Shrink the selected shoveler item for 'out of focus' effect
     */
    this.shrinkShoveler = function() {
      this.shovelerView.shrinkSelected();
    };

    /**
     * Expand the selected shoveler item for 'in focus' effect
     */
    this.expandShoveler = function() {
      this.shovelerView.setTransforms();
    };

    /**
     * Shrink the selected slider item for 'out of focus' effect
     */
    this.shrinkSlider = function() {
      if (this.sliderView !== null) this.sliderView.shrinkSelected();
    };

    /**
     * Expand the selected slider item for 'in focus' effect
     */
    this.expandSlider = function() {
      if (this.sliderView !== null) this.sliderView.setTransforms();
    };

    /**
     * Shrink the selected item for the current view
     */
    this.shrink = function() {
      console.log("shrink");
      switch (this.currentView) {
        case this.sliderView:
          this.sliderView.shrinkSelected();
          break;
        case this.shovelerView:
          this.shovelerView.shrinkSelected();
          break;
        default:
          break;
      }
    };

    /**
     * Expand the selected item the current view
     */
    this.expand = function() {
      console.log("expand");
      switch (this.currentView) {
        case this.sliderView:
          this.sliderView.setTransforms();
          break;
        case this.shovelerView:
          this.shovelerView.setTransforms();
          break;
        default:
          break;
      }
    };

    /**
     * Handle key events
     * @param {event} the keydown event
     */
    this.handleControls = function(e) {
      var dirty = false;

      // pressing play triggers select on the media element
      if (e.type === 'buttonpress') {
        switch (e.keyCode) {
          case buttons.BACK:
            //  console.log(this.currentView);
            switch (this.currentView) {
              case this.shovelerView:
                this.trigger('bounce');
                break;
              default:
                break;
            }
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

    /**
     * Show summary text in the 1D View
     * @param {Number} index number of current element to show data for
     */
    this.showExtraData = function(index) {
      index = index || 0;

      window.setTimeout(function() {
        //add description
        $("#" + ID_ONED_SUMMARY_TITLE).html(this.rowElements[index].title);
        $("#" + ID_ONED_SUMMARY_DATE).html((this.rowElements[index].seconds) ? (this.parseTime(this.rowElements[index].seconds)) : ("<br/>"));
        $("#" + ID_ONED_SUMMARY_DESC).html(this.rowElements[index].description);
      }.bind(this), TIME_TIMEOUT_DISPLAY_INFO);
    };

    /**
     * Hide the text in the 1D view when scrolling starts
     */
    this.hideExtraData = function() {
      $("#" + ID_ONED_SUMMARY_TITLE).text("");
      $("#" + ID_ONED_SUMMARY_DATE).text("");
      $("#" + ID_ONED_SUMMARY_DESC).text("");
    };

    // Convert seconds to HH:MM:SS
    this.parseTime = function(totalSec) {
      var hours = parseInt(totalSec / 3600) % 24;
      var minutes = parseInt(totalSec / 60) % 60;
      var seconds = totalSec % 60;

      return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    };

  };

  exports.OneDViewCategories = OneDViewCategories;
}(window));
