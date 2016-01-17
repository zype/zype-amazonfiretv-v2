/* Full Row View
 *
 * Handles 1D view containing one sub-category of elements
 *
 */

(function (exports) {
    "use strict";

    //module constants
    var ID_ONED_SHOVELER_CONTAINER   = "one-D-shoveler-container",

        ID_ONED_DESCRIPTION_CONTAINER = "one-D-description-container",

        ID_ONED_SUMMARY_TITLE     = "summaryTitle",

        ID_ONED_SUMMARY_DATE      = "summaryDate",

        ID_ONED_SUMMARY_DESC      = "summaryDesc",

        BUTTON_CONTAINER          = "one-D-buttons";

    var TIME_TIMEOUT_DISPLAY_INFO = 350;

    /**
     * @class OneDView
     * @description The 1D view object, this handles everything about the 1D menu.
     */
    var OneDView = function (fromSubCat) {
        // mixin inheritance, initialize this as an event handler for these events:
        Events.call(this, ['noContent', 'exit', 'startScroll', 'indexChange', 'stopScroll', 'select', 'bounce', 'loadComplete', 'makeIAP']);

        //global variables
        this.currSelection = 0;
        this.currentView = null;
        this.titleText = null;
        this.$shovelerContainer = null;
        this.$descContainer = null;
        this.$buttonsContainer = null;
        this.noItems = false;

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
        this.hide = function () {
            this.$el.css('visibility', 'hidden');
            this.shovelerView.hide();
        };

       /**
        * Display this view
        */
        this.show = function () {
            this.$el.css('visibility', 'visible');
            this.shovelerView.show();
        };

       /**
        * Remove the oneDView element
        */
        this.remove = function () {
            if(this.el) {
                $(this.el).remove();
            }
        };

       /**
        * Maintain the current view for event handling
        */
        this.setCurrentView = function (view) {
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
        this.render = function ($el, category, rowData, displayButtonsParam) {
            //Make sure we don't already have a full container
            this.remove();

            // Build the main content template and add it
            this.titleText = rowData.title;
            this.rowElements = rowData;
            var html = utils.buildTemplate($("#one-D-view-items-template"), {
              category: category
            });

            $el.append(html);

            this.$el = $el.children().last();
            this.el = this.$el[0];
            //no results found
            if (rowData.length <= 0) {
                $(".one-d-no-items-container").show();
                this.trigger('loadComplete');
                this.trigger("noContent");
                this.noItems = true;
                return;
            }

            this.noItems = false;
            //gather widths of all the row elements
            this.$elementWidths = [];
            this.createShovelerView(rowData);
            this.createButtonView(displayButtonsParam, this.$el);
            this.createDescView();
            this.setCurrentView(this.shovelerView);
        };

        /**
         * Initialize the desc view
         * @param {Object} data for desc details
         */
        this.createDescView = function() {
          this.$descContainer = this.$el.children("#" + ID_ONED_DESCRIPTION_CONTAINER);
          var descView = this.descView = new DescView();

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
          if(this.buttonView) this.buttonView.setStaticButton();
        };

       /**
        * Initialize the shoveler subview
        * @param {Object} rowData data for the content items
        */
        this.createShovelerView = function (rowData) {
            // create the shoveler subview
            this.$shovelerContainer = this.$el.children("#" + ID_ONED_SHOVELER_CONTAINER);
            var shovelerView = this.shovelerView = new ShovelerView();

            if (fromSubCat) {
              this.shovelerView.setSelectedElement(app.data.currentNestedCategory);
            }
            this.shovelerView.render(this.$shovelerContainer, rowData);

            shovelerView.on('exit', function() {
                this.trigger('exit');
            }, this);

            shovelerView.on('select', function(index) {
                this.currSelection = index;
                this.trigger('select', index);
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
                this.trigger('loadComplete');
                this.showExtraData();
             }, this);
        };

       /**
        * Create the buttons that will appear under the media content
        */
        this.createButtonView = function (displayButtonsParam, $el) {
            if(!displayButtonsParam) {return;}

            // create and set up the button
            this.$buttonsContainer = this.$el.children("#" + BUTTON_CONTAINER);
            var buttonView = this.buttonView = new ButtonView();

            buttonView.on('exit', function() {
                this.trigger('exit');
            }, this);

            buttonView.on('makeIAP', function(sku) {
                this.trigger('makeIAP', sku);
            }, this);

            buttonView.on('showDesc', function(){
              console.log('show.desc');
              this.transitionToDescView();
            }, this);

            var subscribeButtons = iapHandler.getAvailableSubscriptionButtons();
            var purchaseButtons = iapHandler.getAvailablePurchaseButtons();
            buttonView.render(this.$buttonsContainer, subscribeButtons, purchaseButtons);
        };

        /**
        * Externally change the index
        */
        this.changeIndex = function (index) {
            this.shovelerView.setSelectedElement(index);
            this.shovelerView.transitionRow();
            this.shovelerView.trigger("stopScroll", this.shovelerView.currSelection);
        };


       /**
        * Make the shoveler the active view
        */
        this.transitionToShovelerView = function () {

            //change to shoveler view
            this.setCurrentView(this.shovelerView);

            //change opacity of the shoveler
            this.shovelerView.unfadeSelected();

            //set buttons back to static
            if(this.buttonView) this.buttonView.setStaticButton();
        };

        this.shouldShowButtons = function(video) {
            return true;
            return (app.settingsParams.IAP == true && !iapHandler.canPlayVideo(video));
        }

       /**
        * Make the buttons the active view
        */
        this.transitionToButtonView = function () {

            var currentVid = this.currentVideo();

            if ( !this.shouldShowButtons(currentVid) ) {
                return false;
            }

            this.descView.hide();

            //change to button view
            this.setCurrentView(this.buttonView);

            //change opacity of the shoveler
            this.shovelerView.fadeSelected();

            //set default selected button and apply selected style
            this.buttonView.setCurrentSelectedIndex(0);
            this.buttonView.setSelectedButton();
        };

       /**
        * Return to selected shoveler state
        */
        this.transition = function () {
            this.shovelerView.unfadeSelected();
        };

       /**
        * Shrink the selected shoveler item for 'out of focus' effect
        */
        this.shrinkShoveler = function () {
            this.shovelerView.shrinkSelected();
        };

       /**
        * Expand the selected shoveler item for 'in focus' effect
        */
        this.expandShoveler = function () {
            this.shovelerView.setTransforms();
        };

        /**
         * Handle key events
         * @param {event} the keydown event
         */
        this.handleControls = function (e) {
            var dirty = false;

            // pressing play triggers select on the media element
            if (e.type === 'buttonpress') {
                switch (e.keyCode) {
                    case buttons.UP:
                         switch (this.currentView) {
                           case this.shovelerView:
                             this.trigger('bounce');
                             break;
                           case this.buttonView:
                             this.transitionToShovelerView();
                             break;
                           case this.descView:
                             this.transitionToButtonView();
                             break;
                         }
                         dirty = true;
                         break;
                    case buttons.DOWN:
                         if(this.buttonView && this.currentView !== this.buttonView) {
                             this.transitionToButtonView();
                         }
                         dirty = true;
                         break;
                }
            }

            //use the dirty flag to make sure we are not handling the
            //event twice - once for this view and once in the child view
            if(!dirty && this.currentView) {
                this.currentView.handleControls(e);
            }
        }.bind(this);

        /**
         * Show summary text in the 1D View
         * @param {Number} index number of current element to show data for
         */
        this.showExtraData = function (index) {
            index = index || 0;

            window.setTimeout(function () {
                //add description
                $("#" + ID_ONED_SUMMARY_TITLE).html(this.rowElements[index].title);
                $("#" + ID_ONED_SUMMARY_DATE).html((this.rowElements[index].seconds) ? (this.parseTime(this.rowElements[index].seconds)) : ("<br/>"));
                $("#" + ID_ONED_SUMMARY_DESC).html(this.rowElements[index].description);
                if(this.shouldShowButtons(this.rowElements[index])) {
                    // show entire button container
                    this.showAvailableButtons();
                }
            }.bind(this), TIME_TIMEOUT_DISPLAY_INFO);
        };

        this.showAvailableButtons = function() {
            var video = this.currentVideo();

            $("#" + BUTTON_CONTAINER).show();

            $('#descButton').show();

            // show rental button if a subcription is required and they haven't rented
            if(video.purchase_required == true && !iapHandler.hasValidPurchase(video.id)) {
                 $('#' + iapHandler.purchaseSku(video.id) + '-purchase').show();
            }

            // show purchase button if a subcription is required and they haven't purchased
            if(video.rental_required == true && !iapHandler.hasValidRental(video.id)) {
                $('#' + iapHandler.rentalSku(video.id)).show();
            }

            // show subscribe buttons if a subcription is required and they aren't subscribed
            if(video.subscription_required == true && !iapHandler.hasValidSubscription()) {
                $('.detail-row-container-buttons .btnSubscribe').show();
            }
        };

        // Convert seconds to HH:MM:SS

        this.parseTime = function(totalSec){
          var hours = parseInt( totalSec / 3600 ) % 24;
          var minutes = parseInt( totalSec / 60 ) % 60;
          var seconds = totalSec % 60;

          return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
        }

        /**
         * Hide the text in the 1D view when scrolling starts
         */
        this.hideExtraData = function () {
            $("#" + ID_ONED_SUMMARY_TITLE).text("");
            $("#" + ID_ONED_SUMMARY_DATE).text("");
            $("#" + ID_ONED_SUMMARY_DESC).text("");
            $('.detail-row-container-buttons .btnIAP').hide();
            $("#" + BUTTON_CONTAINER).hide();
        };
    };

    exports.OneDView = OneDView;
}(window));
