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
  var OneDView = function() {
    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['noContent', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce', 'loadComplete', 'makeIAP']);

    //global variables
    this.currSelection = 0;
    this.currSliderSelection = 0;
    this.currentView = null;
    this.titleText = "";
    this.$title = null;
    this.$sliderContainer = null;
    this.$sliderContainerOffset = null;
    this.$shovelerContainer = null;
    this.$shovelerContainerOffset = null;
    this.$buttonsContainerOffset = null;
    this.$summaryContainer = null;
    this.$descContainer = null;
    this.$buttonsContainer = null;
    this.$scrollingContainerEle = null;
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

      if (app.data.sliderData.length <= 0) {
        args.displaySliderParam = false;
      }

      // make sure to clean slider's objects if we do not want to show
      if (args.displaySliderParam === false) {
        this.sliderView = null;
      }

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

      this.scrollingContainerEle = $(ID_ONED_VIEW_ELEMENTS)[0];

      if (args.displaySliderParam && app.data.sliderData.length > 0) {
        this.sliderData = app.data.sliderData;
        // console.log(this.sliderData);
        this.createSliderView(this.sliderData);
        $("#" + ID_ONED_SLIDER_CONTAINER).show(); // we need this for scrolling
        this.setCurrentView(this.sliderView);
        this.createShovelerView(args.rowData);
      } else {
        $("#" + ID_ONED_SLIDER_CONTAINER).hide(); // we need this for scrolling
        this.createShovelerView(args.rowData);
        this.setCurrentView(this.shovelerView);
      }

      this.createButtonView(args.displayButtonsParam, this.$el);
    };

    /**
     * Initialize the slider view
     * @param {Object} rowData data for the content items
     */
    this.createSliderView = function(rowData) {
      // create the slider subview
      this.$sliderContainer = this.$el.children("#" + ID_ONED_SLIDER_CONTAINER);
      var sliderView = this.sliderView = new SliderView();

      this.sliderView.render(this.$sliderContainer, rowData);
      this.$sliderContainerOffset = $(this.$sliderContainer)[0].getBoundingClientRect().top;

      sliderView.on('exit', function() {
        this.trigger('exit');
      }, this);

      sliderView.on('select', function(index) {
        this.currSliderSelection = index;
        // let's play a video from the slider
        // to do that we trigger the 'select' event passing 3d arg true
        this.trigger('select', index, true);
      }, this);

      sliderView.on('bounce', function(direction) {
        this.trigger('bounce', direction);
      }, this);

      sliderView.on('startScroll', function(direction) {
        this.hideSliderExtraData();
      }, this);

      sliderView.on('stopScroll', function(index) {
        this.currSliderSelection = index;
        this.showSliderExtraData(index);
      }, this);

      sliderView.on('indexChange', function(index) {
        this.currSliderSelection = index;
      }, this);

      sliderView.on('loadComplete', function() {
        this.sliderLoadComplete = true;
        this.showSliderExtraData();
        if (this.shovelerLoadComplete) {
          this.trigger('loadComplete');
        }
      }, this);
    };

    /**
     * Initialize the desc view
     * @param {Object} data for desc details
     */
    this.createDescView = function() {
      this.$descContainer = $("#" + ID_ONED_DESCRIPTION_CONTAINER);
      var descView = this.descView = new DescView();

      descView.on('exit', function() {
        this.transitionToButtonView();
      });

      descView.on('bounce', function() {
        this.transitionToButtonView();
      }.bind(this));

      descView.update = function() {
        var video = this.currentVideo();
        this.descView.render(this.$descContainer, video);
      }.bind(this);

      this.descView.update();
    };

    this.transitionToDescView = function() {
      //change to desc view
      this.descView.update();
      this.setCurrentView(this.descView);
      this.descView.show();
      //set buttons back to static
      if (this.buttonView) this.buttonView.setStaticButton();
    };

    /**
     * Initialize the shoveler subview
     * @param {Object} rowData data for the content items
     */
    this.createShovelerView = function(rowData) {
      // create the shoveler subview
      this.$shovelerContainer = this.$el.children("#" + ID_ONED_SHOVELER_CONTAINER);
      var shovelerView = this.shovelerView = new ShovelerView();

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
     * Create the buttons that will appear under the media content
     */
    this.createButtonView = function(displayButtonsParam, $el) {

      if (!displayButtonsParam) {
        return;
      }


      // create and set up the button
      this.$buttonsContainer = this.$el.children("#" + BUTTON_CONTAINER);
      var buttonView = this.buttonView = new ButtonView();

      this.$buttonsContainerOffset = $(this.$buttonsContainer)[0].getBoundingClientRect().top;

      buttonView.on('exit', function() {
        this.trigger('exit');
      }, this);

      buttonView.on('makeIAP', function(sku) {
        this.trigger('makeIAP', sku);
      }, this);

      buttonView.on('showDesc', function() {
        console.log('show.desc');
        this.createDescView();
        this.transitionToDescView();
      }, this);

      buttonView.on('play', function() {
        this.trigger('select', this.currSliderSelection);
      }, this);

      var subscribeButtons = iapHandler.getAvailableSubscriptionButtons();
      var purchaseButtons = iapHandler.getAvailablePurchaseButtons();
      buttonView.render(this.$buttonsContainer, subscribeButtons, purchaseButtons);
    };

    /**
     * Externally change the index
     */
    this.changeIndex = function(index) {
      this.shovelerView.setSelectedElement(index);
      this.shovelerView.transitionRow();
      this.shovelerView.trigger("stopScroll", this.shovelerView.currSelection);
    };

    /** Make the slider the active view
     *
     */
    this.transitionToSliderView = function() {
      // change to shoveler view
      this.setCurrentView(this.sliderView);

      // change opacity of the slider
      if (this.sliderView !== null) this.sliderView.unfadeSelected();
      if (this.sliderView !== null) this.sliderView.setTransforms();

      this.shovelerView.fadeSelected();
      this.shovelerView.shrinkSelected();
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

      if (this.sliderView !== null) this.sliderView.fadeSelected();
      if (this.sliderView !== null) this.sliderView.shrinkSelected();

      //set buttons back to static
      if (this.buttonView) this.buttonView.setStaticButton();
    };

    this.shouldShowButtons = function(video) {
      return true;
      // return (app.settingsParams.IAP === true && !iapHandler.canPlayVideo(video));
    };

    /**
     * Make the buttons the active view
     */
    this.transitionToButtonView = function() {

      var currentVid = this.currentVideo();

      if (!this.shouldShowButtons(currentVid)) {
        return false;
      }

      //change to button view
      this.setCurrentView(this.buttonView);

      //change opacity of the shoveler
      this.shovelerView.fadeSelected();
      this.shovelerView.shrinkSelected();

      //set default selected button and apply selected style
      this.buttonView.setCurrentSelectedIndex(0);
      this.buttonView.setSelectedButton();
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
     * @TODO should be refactored
     */
    this.handleControls = function(e) {
      var dirty = false;

      // pressing play triggers select on the media element
      if (e.type === 'buttonpress') {
        switch (e.keyCode) {
          case buttons.UP:
            //  console.log(this.currentView);
            switch (this.currentView) {
              case this.sliderView:
                this.trigger('bounce');
                break;
              case this.shovelerView:
                if (this.sliderView) {
                  this.transitionToSliderView();
                } else {
                  this.trigger('bounce');
                }
                break;
              case this.buttonView:
                this.transitionToShovelerView();
                break;
              case this.descView:
                this.descView.remove();
                this.descView = null;
                this.transitionToButtonView();
                break;
            }
            dirty = true;

            if (this.sliderView !== null) {
              this.shiftOneDContainer();
            }

            break;
          case buttons.DOWN:
            // console.log(this.currentView);
            switch (this.currentView) {
              case this.sliderView:
                this.transitionToShovelerView();
                break;
              case this.shovelerView:
                this.transitionToButtonView();
                break;
              case this.descView:
                this.descView.remove();
                this.descView = null;
                this.transitionToButtonView();
                break;
            }
            dirty = true;

            if (this.sliderView !== null) {
              this.shiftOneDContainer();
            }

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
     * Move the One D container as new components are selected
     */
    this.shiftOneDContainer = function() {
      if (this.currentView == this.shovelerView) {
        this.scrollingContainerEle.style.webkitTransform = "translateY(" + (-this.$shovelerContainerOffset + 240) + "px)";
        $('#slider-summary-container').css("opacity", 0);
        this.$sliderContainer.css("opacity", 0);
      }

      if (this.currentView == this.sliderView) {
        this.scrollingContainerEle.style.webkitTransform = "translateY(" + 0 + "px)";
        $('#slider-summary-container').css("opacity", 100);
        this.$sliderContainer.css("opacity", 100);
      }
    };

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
        if (this.shouldShowButtons(this.rowElements[index])) {
          // show entire button container
          this.showAvailableButtons();
        }
      }.bind(this), TIME_TIMEOUT_DISPLAY_INFO);
    };

    /**
     * Hide the text in the 1D view when scrolling starts
     */
    this.hideExtraData = function() {
      $("#" + ID_ONED_SUMMARY_TITLE).text("");
      $("#" + ID_ONED_SUMMARY_DATE).text("");
      $("#" + ID_ONED_SUMMARY_DESC).text("");
      $('.detail-row-container-buttons .btnIAP').hide();
      $("#" + BUTTON_CONTAINER).hide();
    };

    /**
     * Show summary text in the Slider View
     * @param {Number} index number of current element to show data for
     */
    this.showSliderExtraData = function(index) {
      index = index || 0;

      window.setTimeout(function() {
        //add description
        // console.log(this.sliderData[index].title);
        // console.log(this.sliderData[index].description);
        $("#" + ID_SLIDER_SUMMARY_TITLE).html(this.sliderData[index].title);
        $("#" + ID_SLIDER_SUMMARY_DESC).html(this.sliderData[index].description);
      }.bind(this), TIME_TIMEOUT_DISPLAY_INFO);
    };

    /**
     * Hide the text in the Slider view when scrolling starts
     */
    this.hideSliderExtraData = function() {
      $("#" + ID_SLIDER_SUMMARY_TITLE).text("");
      $("#" + ID_SLIDER_SUMMARY_DESC).text("");
    };

    this.showAvailableButtons = function() {
      var video = this.currentVideo();

      $("#" + BUTTON_CONTAINER).show();

      //  $('#descButton').show();
      $('#playBtn').show();

      // show rental button if a subcription is required and they haven't rented
      if (video.purchase_required === true && !iapHandler.hasValidPurchase(video.id)) {
        $('#' + iapHandler.purchaseSku(video.id) + '-purchase').show();
      }

      // show purchase button if a subcription is required and they haven't purchased
      if (video.rental_required === true && !iapHandler.hasValidRental(video.id)) {
        $('#' + iapHandler.rentalSku(video.id)).show();
      }

      // show subscribe buttons if a subcription is required and they aren't subscribed
      if (video.subscription_required === true && !iapHandler.hasValidSubscription()) {
        $('.detail-row-container-buttons .btnSubscribe').show();
      }
    };

    // Convert seconds to HH:MM:SS

    this.parseTime = function(totalSec) {
      var hours = parseInt(totalSec / 3600) % 24;
      var minutes = parseInt(totalSec / 60) % 60;
      var seconds = totalSec % 60;

      return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    };

  };

  exports.OneDView = OneDView;
}(window));
