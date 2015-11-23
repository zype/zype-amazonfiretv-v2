/* Main Application
 *
 * This module initializes the application and handles
 * transition between different views
 *
 */

(function(exports) {
    "use strict";

   /**
    * Placeholder - Handle page visibility for voice search button on video
    */
    var visibility =  document.getElementById("appstate");

   /**
    * The 'pause' event is fired when the app is sent to the background (app completely hidden) or when its partially obscured
    */
    function onPause() {
        if (app.playerView) {
            app.playerView.pauseVideo();
        }
    }

   /**
    * The 'resume' event is fired when the app is brought to the foreground (app completely visible) including when the Voice Search Dialog is dismissed
    */
    function onResume() {
         if (app.playerView) {
             app.playerView.playVideo();
         }
    }

   /**
    * Add listeners for pause and resume when the platform is ready
    */
    function onAmazonPlatformReady() {
        document.addEventListener("pause" , onPause, false);
        document.addEventListener("resume" , onResume, false);
    }

    document.addEventListener("amazonPlatformReady" , onAmazonPlatformReady, false);
    window.addEventListener('orientationchange', handleDeviceOrientation, false);

   /**
    * Handle device rotation event
    * When in portrait mode put up the app overlay div and notify the user
    * to change back to landscape
    */
    function handleDeviceOrientation() {
        //disregard on FireTV
        if(navigator.userAgent.match(/AFT/i)) {return;}

        //wrap in a timer to make sure the height and width are updated
        setTimeout(function() {
            if(window.innerWidth < window.innerHeight) {
                $('#overlay-message').html('please rotate your device back to landscpe');
                $('#app-overlay').css('display', 'block');
            } else {
                $('#overlay-message').html('');
                $('#app-overlay').css('display', 'none');
            }
        }, 500);
    }


   /**
    * The app object : the controller for the app, it creates views, manages navigation between views
    *                  routes input to the currently focused view, giving data to the views, and otherwise stitching things together
    * @param {Object} settingsParams settings for the application
    *                 settingsParams.dataURL {String} url of the initial data request
    *                 settingsParams.displayButtons {Boolean} flag that tells the app to display the buttons or not
    */
    var App = function(settingsParams) {
        //hold onto the app settings
        this.settingsParams = settingsParams;
        this.showSearch = settingsParams.showSearch;

        //main application container div
        this.$appContainer = $("#app-container");

       /**
        * Callback from XHR to load the data model, this really starts the app UX
        */
        this.dataLoaded = function() {

          // initialize custom styles
          this.updateStyleSheet();
          var logo = this.settingsParams.icon;
          var html = utils.buildTemplate($("#app-header-template"), {
              img_logo:logo,
          });

          this.$appContainer.append(html);

          this.initializeLeftNavView();

          this.selectView(this.leftNavView);

          this.leftNavView.expand();

          this.initializeOneDView();

        }.bind(this);

        // overrides css with configs
        this.updateStyleSheet = function() {
          var sheet = document.styleSheets[0];
          // set up background theme colors
          sheet.insertRule('.content-load-spinner > div {background-color: ' + this.settingsParams.brandColor + ' !important;}', 1);
          sheet.insertRule('#app-container {background-color: ' + this.settingsParams.backgroundColor + ' !important;}', 1);
          sheet.insertRule('.app-top-bar {background-color: ' + this.settingsParams.topBarColor + ' !important;}', 1);
          sheet.insertRule('.app-logo {right: ' + this.settingsParams.iconXPosition + ' !important;}', 1);
          sheet.insertRule('.app-logo {bottom: ' + this.settingsParams.iconYPosition + ' !important;}', 1);

          // set up left nav colors
          sheet.insertRule('.leftnav-list-item-highlighted { color: ' + this.settingsParams.leftNavHoverTextColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-selected { color: ' + this.settingsParams.leftNavHoverTextColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-static { color: ' + this.settingsParams.leftNavTextColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-container { background-color: ' + this.settingsParams.leftNavBackgroundColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-selected { background-color: ' + this.settingsParams.leftNavHoverBackgroundColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-selected { color: ' + this.settingsParams.leftNavHoverTextColor + ' !important; }', 1);
          sheet.insertRule('#left-nav-list-container { background-color: ' + this.settingsParams.topBarColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-highlighted { border-color: ' + this.settingsParams.leftNavHoverBackgroundColor + ' !important;}', 1);
          sheet.insertRule('.leftnav-list-item-highlighted { background-color: ' + this.settingsParams.leftNavHoverBackgroundColor + ' !important;}', 1);

          // set up text color for video thumbnails
          sheet.insertRule('#summaryDate {color: ' + this.settingsParams.mutedTextColor + ' !important;}', 1);
          sheet.insertRule('#summaryTitle {color: ' + this.settingsParams.textColor + ' !important;}', 1);
          sheet.insertRule('#summaryDesc {color: ' + this.settingsParams.textColor + ' !important;}', 1);
        }

       /**
        * Set the application's current view
        * @param {Object} view the current view
        */
        this.selectView = function (view) {
            this.currentView = view;
        };

       /**
        * User has pressed the back button
        */
        this.exitApp = function () {
            if (confirm("Are you sure you want to exit?")) {
                window.open('', '_self').close();
            }
            buttons.resync();
        };

       /**
        * All button events route through here, send them to current view
        * Views are switched based on the type of key press - up and down
        * key events will make the left-nav menu the focus while left and
        * right control the oneDView. When the video player has focus it
        * will handle all key events
        * @param {Event} e
        */
        this.handleButton = function(e) {
            if (this.currentView) {
                this.currentView.handleControls(e);
            } else if (e.type === 'buttonpress' && e.keyCode == buttons.BACK) {
                this.exitApp();
            }
        };

       /**
        * Handle touch events
        */
        this.handleTouch = function(e) {
            if(e.type === 'swipe') {
                if($("#left-nav-list-container").hasClass('leftnav-menulist-collapsed')) {
                    this.currentView = this.oneDView;
                } else {
                    this.currentView = this.leftNavView;
                }
            }
            this.currentView.handleControls(e);
        };

       /***************************
        *
        * Left Nav View Object
        *
        **************************/
        this.initializeLeftNavView = function() {

            var leftNavView = this.leftNavView = new LeftNavView();
            if (this.showSearch) {
                this.searchInputView = new SearchInputView();
            }

           /**
            * Event Handler - Select menu item
            * @param {Number} index the index of the selected item
            */
            leftNavView.on('select', function(index) {
                if (!this.showSearch || index != 0) {
                    //remove the contents of the oneDView
                    this.oneDView.remove();

                    //show the spinner
                    this.showContentLoadingSpinner();

                    //set the newly selected category index
                    if(this.showSearch) { index--;}
                    app.data.setCurrentCategory(index);

                    //update the content
                    this.oneDView.updateCategory();

                    //set the selected view
                    this.selectView(this.oneDView);

                    //hide the leftNav
                    this.leftNavView.collapse();

                    if (this.showSearch) {
                        this.leftNavView.searchUpdated = false;
                        this.searchInputView.reset();
                    }
                }
                else {
                    //remove the contents of the oneDView
                    this.oneDView.remove();

                    //show the spinner
                    this.showContentLoadingSpinner();
                    this.oneDView.updateCategoryFromSearch(this.searchInputView.currentSearchQuery);

                    //set the selected view
                    this.selectView(this.oneDView);

                    //hide the leftNav
                    this.leftNavView.collapse();
                }
            }, this);

           /**
            * Event Handler - deselect leftnav view
            */
            leftNavView.on('deselect', function() {
                this.transitionFromLefNavToOneD();
            }, this);

           /**
            * Event Handler - exit the application
            */
            leftNavView.on('exit', function() {
               this.exitApp();
            }, this);

            if (this.showSearch) {
                this.searchInputView.on('searchQueryEntered', function() {
                    if (this.leftNavView.currSelectedIndex == 0) {
                    this.leftNavView.searchUpdated = true;
                    this.leftNavView.confirmNavSelection();
                    }
                }, this);
            }

            leftNavView.on('makeActive', function() {
                this.transitionToExpandedLeftNavView();
            }, this);

           /**
            * Event Handler - Change index of currently selected menu item
            * @param {Number} index the index of the selected item
            */
            leftNavView.on('indexChange', function(index) {
                //set the newly selected category index
                if (this.showSearch && index == 0) {
                    this.searchInputView.select();
                }
                else {
                    if (this.showSearch) {
                        app.data.setCurrentCategory(index - 1);
                    }
                    else {
                        app.data.setCurrentCategory(index);
                    }
                    if (this.showSearch) {
                        this.searchInputView.deselect();
                    }
                }

            }, this);

            //render the left nav right now
            var leftNavData = app.data.getVideoRows().slice(0);

            var startIndex = 0;
            if (this.showSearch) {
                leftNavData.unshift(this.searchInputView);
                startIndex = 1;
            }
            leftNavView.render(app.$appContainer, leftNavData, startIndex);
        };

       /***************************
        *
        * One D View
        *
        **************************/
        this.initializeOneDView = function() {
            // create and set up the 1D view
            var oneDView = this.oneDView = new OneDView();

           /**
            * Event Handler - Select shoveler item
            * @param {Number} index the index of the selected item
            */
            oneDView.on('select', function(index) {
                this.data.setCurrentItem(index);
                this.transitionToPlayer(index);
            }, this);

           /**
            * Event Handler - No content found for oneD event
            */
            oneDView.on('noContent', function(index) {
                window.setTimeout(function(){
                    this.transitionToLeftNavView();
                    this.leftNavView.setHighlightedElement();
                }.bind(this), 10);
            }, this);

           /**
            * Go back to the left-nav menu list
            * @param {String} direction keypress direction
            */
            oneDView.on('bounce', function() {
                this.transitionToLeftNavView();
            }, this);

           /**
            * Go back to the left-nav menu list if the user presses back
            */
            oneDView.on('exit', function() {
                this.transitionToLeftNavView();
                this.leftNavView.expand();
            }, this);

           /**
            * Event Handler - Load Complete
            * @param {Number} index the index of the selected item
            */
            oneDView.on('loadComplete', function() {
                this.hideContentLoadingSpinner();
                handleDeviceOrientation();
            }, this);

           /**
            * Success Callback handler for category data request
            * @param {Object} categoryData
            */
            var successCallback = function(categoryData) {
                this.categoryData = categoryData;
                oneDView.render(this.$appContainer, categoryData, this.settingsParams.displayButtons);
            }.bind(this);

           /**
            * Get data set for newly-selected category
            */
            oneDView.updateCategoryFromSearch = function(searchTerm) {
                app.data.getDataFromSearch(searchTerm, successCallback);
            }.bind(this),

            oneDView.updateCategory = function() {

              if (this.leftNavView.currSelectedIndex > 1) {
                // this is a category grab of videos
                app.data.getCategoryData(successCallback);
              } else {
                app.data.getPlaylistData(successCallback);
                // this is the featured playlist grab of videos
              }
            }.bind(this),

            //get the first video row right now when it loads
            this.oneDView.updateCategory();
        };

       /**
        * Hide content loading spinner
        */
        this.hideContentLoadingSpinner = function() {
            $('#app-loading-spinner').hide();

            if($('#app-overlay').css('display') !== 'none') {
                $('#app-overlay').fadeOut(250);
            }
        };

       /**
        * Show content loading spinner
        * @param {Boolean} showOverlay if true show the app overlay
        */
        this.showContentLoadingSpinner = function(showOverlay) {

            $('#app-loading-spinner').show();

            if(showOverlay) {
                $('#app-overlay').show();
            }
        };

       /**
        * Hide application header bar - typically used
        * when another view takes over the screen (i.e. player)
        */
        this.hideHeaderBar = function() {
            $("#app-header-bar").hide();
        };

       /**
        * Show application header bar
        */
        this.showHeaderBar = function() {
            $("#app-header-bar").show();
        };

/***********************************
 *
 * Application Transition Methods
 *
 ***********************************/
       /**
        * Set the UI appropriately for the left-nav view
        */
        this.transitionToLeftNavView = function() {
            this.selectView(this.leftNavView);
            this.leftNavView.setHighlightedElement();

            //change size of selected shoveler item
            this.oneDView.shrinkShoveler();
        };

       /**
        * For touch there is no need to select the chosen left-nav
        * item, so we go directly to the expanded view
        */
        this.transitionToExpandedLeftNavView = function() {
            this.selectView(this.leftNavView);

            //expand the left nav
            this.leftNavView.expand();

            //change size of selected shoveler item
            this.oneDView.shrinkShoveler();
        };

       /**
        * Transition from left nav to the oneD view
        */
        this.transitionFromLefNavToOneD = function () {
            if (this.oneDView.noItems) {
                this.leftNavView.setHighlightedElement();
                return;
            }
            this.leftNavView.collapse();
            this.selectView(this.oneDView);

            //change size of selected shoveler item
            this.oneDView.expandShoveler();
        };

       /**
        * Transition from player view to one-D view
        */
        this.transitionFromPlayerToOneD = function () {
            this.selectView(this.oneDView);
            this.playerView.off('videoStatus', this.handleVideoStatus, this);
            this.playerView.remove();
            this.playerView = null;
            this.oneDView.show();
            this.leftNavView.show();
            this.oneDView.shovelerView.show();
            this.showHeaderBar();
        };

       /**
        * Opens a player view and starts video playing in it.
        * @param {Object} itemData data for currently selected item
        */
        this.transitionToPlayer = function (index) {
            var playerView;
            this.playerSpinnerHidden = false;
            if (this.settingsParams.PlaylistView) {
                playerView = this.playerView = new this.settingsParams.PlaylistView(this.settingsParams);
            }
            else {
                playerView = this.playerView = new this.settingsParams.PlayerView(this.settingsParams);
            }
            this.oneDView.hide();
            this.leftNavView.hide();
            this.hideHeaderBar();

            //start the loader
            this.showContentLoadingSpinner(true);

            playerView.on('exit', function() {
                this.hideContentLoadingSpinner();
                this.transitionFromPlayerToOneD();
            }, this);

            playerView.on('indexChange', function(index) {
                this.oneDView.changeIndex(index);
            }, this);


            this.selectView(playerView);

            playerView.on('videoStatus', this.handleVideoStatus, this);
            // stream video first gets the stream and then renders the player
            this.start_stream(playerView, this.$appContainer, this.categoryData, index);
        };

        this.start_stream = function (playerView, container, categoryData, index) {
          var data = categoryData[index];
          $.ajax({
              url: this.settingsParams.player_endpoint + 'embed/' + data.id + '.json?autoplay=true&app_key=' + this.settingsParams.app_key,
              type: 'GET',
              dataType: 'json',
              success: function(player_json) {

                var outputs = player_json.response.body.outputs;
                for(var i=0; i < outputs.length; i++) {
                  var output = outputs[i];
                  data.url = output.url;
                  if (output.name === 'hls') {
                    data.format = 'application/x-mpegURL'
                  } else if (output.name === 'm3u8') {
                    data.format = 'application/x-mpegURL'
                  } else if (output.name === 'mp4') {
                    data.format = 'video/mp4';
                  }

                  // add ad schedule to video json
                  if (player_json.response.body.advertising) {
                    data.ad_schedule = []
                    var schedule = player_json.response.body.advertising.schedule;
                    for(i = 0; i < schedule.length; i++) {
                      // add each ad tag in, make played be false
                      var seconds = schedule[i].offset / 1000;
                      data.ad_schedule.push({offset: seconds, tag: schedule[i].tag, played: false});
                    }
                  }

                  playerView.render(container, categoryData, index);
                }
              },
              error:function() {
                  console.log(arguments);
              }
          });
        };

       /**
        * Apps player status handler, currently just checks for playing and hides spinner and turns off the handler.
        */
        this.handleVideoStatus = function(currTime, duration, type) {
            if (!this.playerSpinnerHidden && type === "playing") {
                this.hideContentLoadingSpinner();
                this.playerSpinnerHidden = true;
            }
            else if (type === "canplay") {
                this.playerView.playVideo();
            }
            else if (type === "ended") {
                this.hideContentLoadingSpinner();
                this.transitionFromPlayerToOneD();
            }
        };

        // set up button handlers
        buttons.on('buttonpress', this.handleButton, this);
        buttons.on('buttonrepeat', this.handleButton, this);
        buttons.on('buttonrelease', this.handleButton, this);

        touches.on('touch', this.handleTouch, this);
        touches.on('swipe', this.handleTouch, this);

        //initialize the model and get the first data set
        this.data = new this.settingsParams.Model(this.settingsParams);
        this.data.loadCategoryData(this.dataLoaded);
    };

    exports.App = App;
}(window));
