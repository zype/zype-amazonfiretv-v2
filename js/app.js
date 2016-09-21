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
  var visibility = document.getElementById("appstate");

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
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  }

  document.addEventListener("amazonPlatformReady", onAmazonPlatformReady, false);
  window.addEventListener('orientationchange', handleDeviceOrientation, false);

  /**
   * Handle device rotation event
   * When in portrait mode put up the app overlay div and notify the user
   * to change back to landscape
   */
  function handleDeviceOrientation() {
    //disregard on FireTV
    if (navigator.userAgent.match(/AFT/i)) {
      return;
    }

    //wrap in a timer to make sure the height and width are updated
    setTimeout(function() {
      if (window.innerWidth < window.innerHeight) {
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
    // hold onto the app settings
    this.settingsParams = settingsParams;
    this.showSearch = settingsParams.showSearch;

    // main application container div
    this.$appContainer = $("#app-container");

    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['purchased', 'videoError', 'link']);

    this.on("purchased", function() {
      this.oneDView.onPurchaseSuccess();
    }, this);

    this.on("videoError", function() {
      alert("There was an error playing the video.");
      this.exit();
    }, this);
    /**
     * Callback from XHR to load the data model, this really starts the app UX
     */
    this.dataLoaded = function() {
      // initialize custom styles
      this.createStyleSheet();
      this.setBodyClasses();

      var logo = this.settingsParams.icon;
      var html = utils.buildTemplate($("#app-header-template"), {
        img_logo: logo,
      });

      this.$appContainer.append(html);

      // DEVICE LINKING CHECKING PROCESS
      if (this.settingsParams.device_linking === true && this.settingsParams.IAP === false) {
        // Check PIN Status
        deviceLinkingHandler.getPinStatus(this.settingsParams.device_id, function(result) {
          if (result === false || result.linked === false) {
            // Device not linked
            this.settingsParams.linked = false;

            // Device Linking Acquiring PIN
            this.initializeDeviceLinkingView();
            this.selectView(this.deviceLinkingView);
          }
          // Build App
          else {
            // Device Linking Success
            this.settingsParams.linked = true;

            // Retrieve new Access Token on launch
            deviceLinkingHandler.retrieveAccessToken(this.settingsParams.device_id, result.pin, function(result) {

              if (result) {
                deviceLinkingHandler.setOauthData(result);


                // Entitlements / My Library
                if (this.settingsParams.entitlements) {
                  app.data.loadEntitlementData(deviceLinkingHandler.getAccessToken(), function(result) {
                    
                    app.data.categoryData.unshift('My Library');

                    this.settingsParams.nav.library = this.settingsParams.nav.search + 1;
                    this.settingsParams.nav.playlist = this.settingsParams.nav.search + 2;

                    if (result) {
                      if (result.response.length > 0) {
                        app.data.entitlementData = result;
                      }
                    }

                    this.build();
                  }.bind(this));
                }
                // Normal Device Linking
                else {
                  this.build();
                }
              }
              else {
                console.log("Error - retrieveAccessToken failed");
                alert("There was an error configuring your Fire TV App. Please relaunch and try again");
                app.exit();
              }
            }.bind(this));
          }
        }.bind(this));
      }
      // IAP Checking Process
      else if (this.settingsParams.device_linking === false && this.settingsParams.IAP === true) {
        console.log("IAP");
        this.build();
      }
      else if (this.settingsParams.device_linking === true && this.settingsParams.IAP === true) {
        console.log("Device Linking and IAP both enabled. Only one may be enabled at a time.");
        alert("There was an error configuring your Fire TV App.");
        app.exit();
      }
      else {
        this.build();
      }
    }.bind(this);

    this.build = function() {
      if (this.deviceLinkingView && this.currentView === this.deviceLinkingView) {

        this.deviceLinkingView.remove();

        this.data.loadData(function() {

          if (app.settingsParams.browse === true) {
            if (app.settingsParams.nested_categories === true) {
              this.initializeNestedCategories();
              this.selectView(this.nestedCategoriesOneDView);
            } else {
              this.initializeLeftNavView();
              this.initializeOneDView();
              this.selectView(this.oneDView);
              this.leftNavView.collapse();
            }
          }
          else {
            deviceLinkingHandler.retrieveAccessToken(this.settingsParams.device_id, deviceLinkingHandler.getDevicePin(), function(result) {
              if (result) {
                deviceLinkingHandler.setOauthData(result);

                // Entitlements / My Library
                if (this.settingsParams.entitlements) {
                  app.data.loadEntitlementData(deviceLinkingHandler.getAccessToken(), function(result) {
                    
                    app.data.categoryData.unshift('My Library');

                    this.settingsParams.nav.library = this.settingsParams.nav.search + 1;
                    this.settingsParams.nav.playlist = this.settingsParams.nav.search + 2;
                    
                    if (result) {
                      if (result.response.length > 0) {
                        app.data.entitlementData = result;
                      }
                    }

                    if (app.settingsParams.nested_categories === true) {
                      this.initializeNestedCategories();
                      this.selectView(this.nestedCategoriesOneDView);
                    } else {
                      this.initializeLeftNavView();
                      this.initializeOneDView();
                      this.selectView(this.oneDView);
                      this.leftNavView.collapse();
                    }

                  }.bind(this));
                }
                // Normal Device Linking
                else {
                  if (app.settingsParams.nested_categories === true) {
                    this.initializeNestedCategories();
                    this.selectView(this.nestedCategoriesOneDView);
                  } else {
                    this.initializeLeftNavView();
                    this.initializeOneDView();
                    this.selectView(this.oneDView);
                    this.leftNavView.collapse();
                  }
                }
              }
              else {
                console.log("Error - retrieveAccessToken failed");
                alert("There was an error configuring your Fire TV App. Please relaunch and try again");
                app.exit();
              }
            }.bind(this));
          }
          
        }.bind(this));
      } else {
        /**
         * Handles nested categories
         */
        if (this.settingsParams.nested_categories === true) {
          this.initializeNestedCategories();
          this.selectView(this.nestedCategoriesOneDView);
        } else {
          this.initializeLeftNavView();
          this.initializeOneDView();
          this.selectView(this.oneDView);
          this.leftNavView.collapse();
        }
      }
    };

    // overrides css with configs
    this.createStyleSheet = function() {
      var style = document.createElement('style');
      var rules = [
        // Loading Indicator
        '.content-load-spinner { border-right-color: ' + this.settingsParams.brandColor + '; }',
        '.content-load-spinner { border-bottom-color: ' + this.settingsParams.brandColor + '; }',
        '.content-load-spinner { border-left-color: ' + this.settingsParams.brandColor + '; }',
        // Navigation
        '#left-nav-menu-icon.leftnav-menu-icon-highlight .menu-line { background: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-menu-list { border-color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-list-item-highlighted { color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-list-item-static.leftnav-list-item-selected { color: ' + this.settingsParams.brandColor + '; }',
        // Search
        '.leftnav-search-box.leftnav-list-item-selected { color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-search-box:focus::-webkit-input-placeholder { color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-search-box:focus:-moz-placeholder { color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-search-box:focus::-moz-placeholder { color: ' + this.settingsParams.brandColor + '; }',
        '.leftnav-search-box:focus:-ms-input-placeholder { color: ' + this.settingsParams.brandColor +'; }',
        // Buttons
        '.detail-item-button.detail-item-button-static { border-color: ' + this.settingsParams.brandColor + '; }',
        '.detail-item-button.detail-item-button-selected { background: ' + this.settingsParams.brandColor + '; border-color: ' + this.settingsParams.brandColor + '; }',
        // Slider Pagination
        '.circle-current { background: ' + this.settingsParams.brandColor + '; border-color: ' + this.settingsParams.brandColor + '; }',
      ];

      rules = rules.join('');

      style.appendChild(document.createTextNode(rules));

      document.getElementsByTagName('head')[0].appendChild(style);
    };

    /**
     * Set the body classes based on API configs
     */
    this.setBodyClasses = function() {
      var body = document.getElementsByTagName('body')[0];
      var bodyClasses = [];

      bodyClasses.push(this.settingsParams.theme);
      bodyClasses.push(this.settingsParams.logoPosition);

      for (var i = 0; i < bodyClasses.length; i++) {
        body.classList.add(bodyClasses[i]);
      }
    };

    /**
     * Set the application's current view
     * @param {Object} view the current view
     */
    this.selectView = function(view) {
      this.currentView = view;
    };

    /**
     * User has pressed the back button
     */
    this.exitApp = function() {
      if (confirm("Are you sure you want to exit?")) {
        window.open('', '_self').close();
      }
      buttons.resync();
    };

    /**
     * Forced Exit
     */
    this.exit = function() {
      window.open('', '_self').close();
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
      if (e.type === 'swipe') {
        if ($("#left-nav-list-container").hasClass('leftnav-menulist-collapsed')) {
          this.currentView = this.oneDView;
        } else {
          this.currentView = this.leftNavView;
        }
      }
      this.currentView.handleControls(e);
    };


    /**
     *
     * Device Linking View Object
     *
     */
    this.initializeDeviceLinkingView = function() {
      var deviceLinkingView = this.deviceLinkingView = new DeviceLinkingView();

      deviceLinkingView.on('exit', function() {
        console.log("device.linking.view.exit.event");
        this.exitApp();
      }, this);

      deviceLinkingView.on('loadComplete', function() {
        this.settingsParams.browse = false;
        this.hideContentLoadingSpinner();
      }, this);

      deviceLinkingView.on('linkingSuccess', function(pin) {
        console.log('linking.success');

        this.settingsParams.linked = true;
        this.settingsParams.browse = false;

        // Store successfully linked PIN
        deviceLinkingHandler.setDevicePin(pin);

        this.build();
      }, this);

      deviceLinkingView.on('linkingFailure', function() {
        console.log('linking.failure');
        alert("Please reload the app!");
      }, this);

      deviceLinkingView.on('startBrowse', function() {
        this.showContentLoadingSpinner(true);
        this.settingsParams.browse = true;
        this.build();
      }, this);

      deviceLinkingView.render(this.$appContainer);
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
        // Home
        if (index === this.settingsParams.nav.home) {
          this.transitionToCategories();
        }
        // Search
        else if (index === this.settingsParams.nav.search) {
          if (this.oneDView.sliderView) {
            this.oneDView.sliderView.remove();
          }

          if (this.oneDView) {
            this.oneDView.remove();  
          }

          //show the spinner
          this.showContentLoadingSpinner(true);

          app.data.setCurrentCategory(index);
          console.log('app.data.currentCategory', app.data.currentCategory);

          this.oneDView.updateCategoryFromSearch(this.searchInputView.currentSearchQuery);

          //set the selected view
          this.selectView(this.oneDView);

          //hide the leftNav
          this.leftNavView.collapse();
        }
        // Library, Playlist, Category
        else {
          if (this.oneDView.sliderView) {
            this.oneDView.sliderView.remove();
          }

          if (this.oneDView) {
            this.oneDView.remove();  
          }

          //show the spinner
          this.showContentLoadingSpinner(true);

          app.data.setCurrentCategory(index);
          console.log('app.data.currentCategory: ', app.data.currentCategory);

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
        this.transitionFromLefNavToOneD();
      }, this);

      /**
       * Event Handler - search query
       */
      if (this.showSearch) {
        this.searchInputView.on('searchQueryEntered', function() {
          if (this.leftNavView.currSelectedIndex === this.settingsParams.nav.search) {
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
        if (index === this.settingsParams.nav.search) {
          this.searchInputView.select();
        }
        else {
          if (this.showSearch) {
            this.searchInputView.deselect();
          }
        }
      }, this);

      var successCallback = function(categoryItems) {
        var leftNavData = categoryItems;

        var startIndex = 0;

        if (this.showSearch) {
          leftNavData.unshift(this.searchInputView);
        }
        if (this.settingsParams.nested_categories === true) {
          leftNavData.unshift('Home');
        }

        // Start on Featured Playlist
        startIndex = this.settingsParams.nav.playlist;
        
        app.data.setCurrentCategory(startIndex);
        leftNavView.render(this.$appContainer, leftNavData, startIndex);
      }.bind(this);

      leftNavView.updateCategoryItems = function() {
        app.data.getCategoryItems(successCallback);
      }.bind(this);

      this.leftNavView.updateCategoryItems();
    };

    /**
     * Nested Categories One D View
     */
    this.initializeNestedCategories = function() {
      var nestedCategoriesOneDView = this.nestedCategoriesOneDView = new OneDViewCategories();

      /**
       * Event handler - select shoveler item
       * @param {number} index the index of the selected item
       */
      nestedCategoriesOneDView.on('select', function(index) {
        console.log('on.select.event');
        app.data.setcurrentChannel(index);

        var data = this.channelsData[index];
        app.data.setCategoryId(data.category_id);
        app.data.setPlaylistId(data.playlist_id);

        app.data.setPlaylistIds(data.playlist_ids);

        // here, "Category" refers to the selected ZObject Category / Title of Playlists
        this.transitionToCategory();
      }, this);

      /**
       * Exit if the user presses back
       */
      nestedCategoriesOneDView.on('exit', function() {
        this.exitApp();
      }, this);

      /**
       * Event handler - Load complete
       * @param {Number} index the index of the selected item
       */
      nestedCategoriesOneDView.on('loadComplete', function() {
        this.hideContentLoadingSpinner();
        // handleDeviceOrientation();
        this.nestedCategoriesOneDView.expand();
      }, this);

      /**
       * Success Callback handler for categories data request
       * @param {Object} categories data
       */
      var successCallback = function(channelsData) {
        this.channelsData = channelsData;
        var OneDViewCategoriesArgs = {
          $el: app.$appContainer,
          title: "Categories",
          rowData: channelsData
        };
        nestedCategoriesOneDView.render(OneDViewCategoriesArgs);
      }.bind(this);

      /*
       * Get the categories data from the data model
       */
      nestedCategoriesOneDView.updateCategories = function() {
        app.data.getCategories(successCallback);
      }.bind(this);

      this.nestedCategoriesOneDView.updateCategories();
    };

    /**
     * Set the UI appropriately for the category
     */
    this.transitionToCategory = function() {
      this.showContentLoadingSpinner(true);
      console.log('transition.to.category');

      this.nestedCategoriesOneDView.shovelerView.remove();
      this.nestedCategoriesOneDView.remove();
      this.nestedCategoriesOneDView = null;

      app.data.loadData(function() {
        this.initializeLeftNavView();
        this.initializeOneDView();
        this.selectView(this.oneDView);
        this.leftNavView.collapse();
      }.bind(this));
    };

    /**
     * Set the UI appropriately for the categories
     */
    this.transitionToCategories = function() {
      this.showContentLoadingSpinner(true);
      console.log('transition.to.categories');

      if (this.oneDView.sliderView) this.oneDView.sliderView.remove();
      if (this.oneDView.shovelerView) this.oneDView.shovelerView.remove();
      this.oneDView.remove();
      this.oneDView = null;

      this.leftNavView.remove();
      this.leftNavView = null;

      this.initializeNestedCategories();
      this.nestedCategoriesOneDView.on('loadComplete', function() {
        this.selectView(this.nestedCategoriesOneDView);
      }, this);
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
      oneDView.on('select', function(index, fromSlider) {
        if (fromSlider) {
          this.verifyVideo(index, fromSlider);
        } else {
          app.data.setCurrentItem(index);
          this.verifyVideo(index, fromSlider);
        }
      }, this);

      /**
       * Event Handler - No content found for oneD event
       */
      oneDView.on('noContent', function(index) {
        if (this.oneDView.sliderView === null) {
          window.setTimeout(function() {
            this.transitionToLeftNavView();
            this.leftNavView.setHighlightedElement();
          }.bind(this), 10);
        }
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
        if (this.settingsParams.nested_categories === true) {
          this.transitionToCategories();
        } else {
          this.exitApp();
        }
      }, this);

      /**
       * Event Handler - Load Complete
       * @param {Number} index the index of the selected item
       */
      oneDView.on('loadComplete', function() {
        this.hideContentLoadingSpinner();
        // handleDeviceOrientation();
        this.oneDView.expand();
      }, this);

      /**
       * Event Handler - Make In-App-Purchase shoveler item
       * @param {Number} sku is the sku of the selected item
       */
      oneDView.on('makeIAP', function(sku) {
        iapHandler.purchaseItem(sku);
      }, this);

      oneDView.on('link', function() {
        this.transitionToDeviceLinking();
      }, this);

      this.transitionToDeviceLinking = function() {
        this.showContentLoadingSpinner(true);
        console.log('transition.to.device.linking.view');

        if (this.oneDView.sliderView) this.oneDView.sliderView.remove();
        this.oneDView.shovelerView.remove();
        this.oneDView.remove();
        this.oneDView = null;

        this.leftNavView.remove();
        this.leftNavView = null;

        this.initializeDeviceLinkingView();
        this.selectView(this.deviceLinkingView);
      }.bind(this);

      /**
       * Success Callback handler for category data request
       * @param {Object} categoryData
       */
      var successCallback = function(categoryData) {
        // these are the videos
        this.categoryData = categoryData;

        var categoryTitle = "";
        if (this.leftNavView.currSelectedIndex === this.settingsParams.nav.search) {
          categoryTitle = "Search";
        } else {
          categoryTitle = app.data.categoryData[this.leftNavView.currSelectedIndex];
        }

        // reset searchUpdated
        this.leftNavView.searchUpdated = false;

        /*
         * Here we assume that a client has, so called, the "Featured" list by default
         * @NOTE What if the client does not have that playlist?
         * Actually that is not issue, we will add New Releases by default
         */
        var showSlider = function() {
          // Show Slider on Featured Playlist only
          if (app.data.currentCategory === this.settingsParams.nav.playlist && !this.settingsParams.nested_categories) {
            return true;
          }
          return false;
        }.bind(this);

        if (this.settingsParams.IAP === true) {
          // this part handles the IAP case

          // add video ids to iapHandler
          var video_ids = _.map(this.categoryData, function(v) {
            return v.id;
          });

          iapHandler.state.allVideoIds = video_ids;

          // add reference of oneDView to iapHandler
          iapHandler.oneDView = oneDView;

          // get the available items from amazon
          iapHandler.checkAvailableItems(function() {
            renderOneDView();
          });
        } else {
          renderOneDView();
        }

        function renderOneDView() {
          var oneDViewArgs = {
            $el: app.$appContainer,
            title: categoryTitle,
            rowData: app.categoryData,
            displayButtonsParam: app.settingsParams.displayButtons,
            displaySliderParam: false
          };
          if (showSlider()) {
            oneDViewArgs.displaySliderParam = true;
            oneDView.render(oneDViewArgs);
          } else {
            oneDView.render(oneDViewArgs);
          }
        }

      }.bind(this);

      /**
       * Get data if the search feature is used
       */
      oneDView.updateCategoryFromSearch = function(searchTerm) {
        app.data.getDataFromSearch(searchTerm, successCallback);
      }.bind(this);

      oneDView.updateCategory = function() {
        // Entitlements / My Library
        if (this.settingsParams.entitlements && this.settingsParams.nav.library && this.leftNavView.currSelectedIndex === this.settingsParams.nav.library) {
          app.data.getEntitlementData(app.data.entitlementData, successCallback);
        }
        // Featured Playlist || Playlists only
        else if ((!this.settingsParams.playlists_only && this.settingsParams.nav.playlist && this.leftNavView.currSelectedIndex === this.settingsParams.nav.playlist) || (this.settingsParams.playlists_only && this.leftNavView.currSelectedIndex >= this.settingsParams.nav.playlist)) {
          app.data.getPlaylistData(successCallback);
        }
        // Category
        else {
          app.data.getCategoryData(successCallback);
        }
      }.bind(this);

      // Get first video row on load
      this.oneDView.updateCategory();
    };

    /**
     * Hide content loading spinner
     */
    this.hideContentLoadingSpinner = function() {
      $('#app-loading-spinner').fadeOut();

      if ($('#app-overlay').css('display') !== 'none') {
        $('#app-overlay').fadeOut();
      }
    };

    /**
     * Show content loading spinner
     * @param {Boolean} showOverlay if true show the app overlay
     */
    this.showContentLoadingSpinner = function(showOverlay) {

      $('#app-loading-spinner').show();

      if (showOverlay) {
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

      //change size of selected slider and shoveler item
      this.oneDView.shrink();
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
      this.oneDView.shrink();
    };

    /**
     * Transition from left nav to the oneD view
     */
    this.transitionFromLefNavToOneD = function() {
      if (this.oneDView.noItems && !this.oneDView.sliderView) {
        return this.leftNavView.setHighlightedElement();
      }

      this.leftNavView.collapse();
      this.selectView(this.oneDView);
      //change size of selected slider item
      this.oneDView.expand();
    };

    /**
     * Transition from player view to one-D view
     */
    this.transitionFromPlayerToOneD = function() {
      this.hideContentLoadingSpinner();
      this.selectView(this.oneDView);
      this.playerView.off('videoStatus', this.handleVideoStatus, this);
      this.playerView.remove();
      this.playerView = null;
      this.oneDView.show();
      this.leftNavView.show();
      if (this.oneDView.shovelerView) {
        this.oneDView.shovelerView.show();  
      }
      this.showHeaderBar();
    };

    this.transitionFromAlertToOneD = function() {
      this.selectView(this.oneDView);
      buttons.resync();
    };

    /**
     * Verifies video playability and calls appropriate method
     * @param {integer} the video's index
     * @param {boolean} if selected video was from the slider
     */
    this.verifyVideo = function(index, fromSlider) {
      var video;

      if (fromSlider) {
        video = app.data.sliderData[index];
      } else {
        video = this.categoryData[index];
      }

      // IAP and Free
      if (iapHandler.canPlayVideo(video) === false) {
        return false;
      }
      // Device Linking
      else if (this.settingsParams.device_linking === true) {

        if (this.settingsParams.linked === true) {

          // Access Token check
          if (deviceLinkingHandler.hasValidAccessToken() === true) {

            var accessToken = deviceLinkingHandler.getAccessToken();
            
            // Entitlement check
            deviceLinkingHandler.isEntitled(video.id, accessToken, function(result) {
              if (result === true) {
                return this.transitionToPlayer(index, fromSlider, accessToken);
              }
              else {
                alert('You are not authorized to access this content.');
                return this.transitionFromAlertToOneD();
              }
            }.bind(this));

          }
          else {
            console.log('No valid access token, refreshing');

            // Refresh Access Token
            var oauth = deviceLinkingHandler.getOauthData();

            deviceLinkingHandler.refreshAccessToken(this.settingsParams.client_id, this.settingsParams.client_secret, oauth.refresh_token, function(result) {
              if (result !== false) {
                deviceLinkingHandler.setOauthData(result);

                var accessToken = deviceLinkingHandler.getAccessToken();

                // Entitlement check
                deviceLinkingHandler.isEntitled(video.id, accessToken, function(result) {
                  if (result === true) {
                    return this.transitionToPlayer(index, fromSlider, accessToken);
                  }
                  else {
                    alert('You are not authorized to access this content.');
                    return this.transitionFromAlertToOneD();
                  }
                }.bind(this));
              }
              else {
                console.log('Error - refreshAccessToken');
                alert('Authentication Error: Please try again.');
                return this.transitionFromAlertToOneD();
              }
            }.bind(this));  
          }
        }
        else {
          // Device Linking is enabled, but device is not linked
          if (this.settingsParams.browse === false) {
            // Subscription has expired. Clear local storage and force re-link
            deviceLinkingHandler.clearLocalStorage();
            alert('Authentication Error: You are not authorized to access this content. Device is not linked. Please relaunch and link again.');
          }
          else {
            alert('Authentication Error: You are not authorized to access this content. Device is not linked.');
          }
          this.transitionFromAlertToOneD();
          return false;
        }
      }
      else {
        // canPlayVideo === true && device_linking === false - transitionToPlayer
        this.transitionToPlayer(index, fromSlider, accessToken);
      }
    };

    /**
     * Opens a player view and starts video playing in it.
     * @param {Object} itemData data for currently selected item
     */
    this.transitionToPlayer = function(index, fromSlider, accessToken) {
      // Create the PlayerView
      var playerView;
      this.playerSpinnerHidden = false;

      if (this.settingsParams.PlaylistView && this.settingsParams.autoplay && !fromSlider) {
        playerView = this.playerView = new this.settingsParams.PlaylistView(this.settingsParams);
      } else {
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
      if (fromSlider) {
        this.start_stream(playerView, this.$appContainer, app.data.sliderData, index, accessToken);
      } else {
        this.start_stream(playerView, this.$appContainer, this.categoryData, index, accessToken);
      }
    };

    this.start_stream = function(playerView, container, items, index, accessToken) {
      var video = items[index];
      var url_base = this.settingsParams.player_endpoint + 'embed/' + video.id + '.json';
      var uri = new URI(url_base);
      uri.addSearch({
        autoplay: this.settingsParams.autoplay
      });
      if (!this.settingsParams.IAP && typeof accessToken !== 'undefined' && accessToken) {
        uri.addSearch({ access_token: accessToken });
      }
      else if (this.settingsParams.IAP) {
        var consumer = iapHandler.state.currentConsumer;

        if (typeof consumer !== 'undefined' && consumer && consumer.access_token) {
          uri.addSearch({
            access_token: consumer.access_token
          });
        }
      }
      else {
        uri.addSearch({ app_key: this.settingsParams.app_key });
      }

      $.ajax({
        url: uri.href(),
        type: 'GET',
        dataType: 'json',
        context: this,
        success: function(player_json) {
          var outputs = player_json.response.body.outputs;
          for (var i = 0; i < outputs.length; i++) {
            var output = outputs[i];
            video.url = utils.makeSSL(output.url);
            if (output.name === 'hls' || output.name === 'm3u8') {
              video.format = 'application/x-mpegURL';
            } else if (output.name === 'mp4') {
              video.format = 'video/mp4';
            }

            // add ad schedule to video json
            if (player_json.response.body.advertising) {
              video.ad_schedule = [];
              var schedule = player_json.response.body.advertising.schedule;
              for (var i = 0; i < schedule.length; i++) {
                // add each ad tag in, make played be false
                var seconds = schedule[i].offset / 1000;
                video.ad_schedule.push({
                  offset: seconds,
                  tag: schedule[i].tag,
                  played: false
                });
              }
            }

            playerView.render(container, items, index);
          }
        },
        error: function() {
          console.log('start_stream.error', arguments);
          alert("There was an error playing this video, please try again");
          this.transitionFromPlayerToOneD();
          this.transitionFromAlertToOneD();
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
      } else if (type === "canplay") {
        this.playerView.playVideo();
      } else if (type === "ended") {
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
    this.data.loadData(this.dataLoaded);
  };

  exports.App = App;
}(window));
