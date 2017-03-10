/* PlaylistPlayerView
 *
 * Handles playing videos continulously from a playlist
 */
 
(function(exports) {
  "use strict";
 
  /**
   * @class PlaylistPlayerView
   * @description Handles playing videos continulously from a playlist
   */
  var PlaylistPlayerView = function(settings) {
    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['exit', 'videoStatus', 'indexChange', 'videoError']);
 
    this.currentPlayerView    = null;
    this.preloadedPlayerView  = null;
    this.currentIndex         = null;
    this.items                = null;
    this.$el                  = null;
    this.settings             = settings;
    this.currentView          = null;
    this.PlayerView           = settings.PlayerView;
    this.previewShowing       = false;
    this.previewDismissed     = false;
    this.$previewEl           = null;
    this.$countdown_text      = null;
    this.previewTime          = settings.previewTime;
    this.timeTillPlay         = null;
    this.PREVIEW_TIME_DEFAULT = 10;
 
    this.remove = function() {
      if (this.currentPlayerView) {
        this.currentPlayerView.remove();
      }
      if (this.preloadedPlayerView) {
        this.preloadedPlayerView.remove();
      }
    };
 
    /**
     * Initial function to setup and start the playlist of media
     */
    this.render = function($el, items, startIndex) {
      if (!this.previewTime) {
        this.previewTime = this.PREVIEW_TIME_DEFAULT;
      }

      this.$el = $el;
      this.currentIndex = startIndex;
      this.items = items;

      this.currentPlayerView = new this.PlayerView(this.settings);
 
      // Register for events (PlayerView)
      this.currentPlayerView.on('exit',        this.exit,              this);
      this.currentPlayerView.on('videoStatus', this.handleVideoStatus, this);
      this.currentPlayerView.on('videoError',  this.handleVideoError,  this);

      this.currentPlayerView.render($el, items, startIndex);
 
      // touch events
      touches.registerTouchHandler("player-content-video",      this.handleTouchPlayer);
      touches.registerTouchHandler("player-controls-container", this.handleTouchPlayer);
      touches.registerTouchHandler("player-back-button",        this.handleTouchPlayer);
      touches.registerTouchHandler("player-pause-indicator",    this.handleTouchPlayer);

      // Set Current View
      this.currentView = this.currentPlayerView;
    };
 
    /**
     * Handle Touch events for the player
     * @param {Event} e
     */
    this.handleTouchPlayer = function(e) {
      if (e.target.className === "player-back-button") { //back button
        this.currentView.handleControls({
          type: "touch",
          keyCode: buttons.BACK
        });
      } else {
        this.currentView.handleControls({
          type: "touch",
          keyCode: buttons.PLAY_PAUSE
        });
      }
    }.bind(this);
 
    /**
     * Verifies the playability of the next video.
     */
    this.verifyNextVideo = function() {
      var video = this.items[this.currentIndex + 1];
      var nextIndex = this.currentIndex + 1;
 
      if (this.$previewEl) {
        this.$previewEl.remove();
      }
 
      this.previewDismissed = true;
 
      if ((this.items.length > this.currentIndex + 1) && iapHandler.canPlayVideo(video) && deviceLinkingHandler.canPlayVideo()) {
        
        // Device Linking. Enforce if watchAVOD === false.
        if (this.settings.linked && this.settings.watchAVOD === false) {
          // if device linking, check entitlement
          var accessToken = deviceLinkingHandler.getAccessToken();
 
          deviceLinkingHandler.isEntitled(video.id, accessToken, function(result){
            if (result === true) {
              // Handle Time-Limited Videos
              if (app.settingsParams.limit_videos_by_time && !app.settingsParams.subscribe_no_limit_videos_by_time && app.isTimeLimited(video) === true) {
                return app.doTimeLimit(nextIndex, false, accessToken, true);
              }
              return this.transitionToNextVideo(nextIndex, accessToken);
            }
            else {
              this.exit();
              alert('You are not authorized to access this content.');
              app.transitionFromAlertToOneD();
            }
          }.bind(this));
        }
        // Free / Watch AVOD
        else {
          this.transitionToNextVideo(nextIndex, accessToken);
        }
      }
      else {
        this.exit();
      }
    };
 
    /**
     * Handles showing the view to transition from playing one video to the next
     */
    this.transitionToNextVideo = function(index, accessToken) {
      var video = this.items[index];
      var url_base = this.settings.player_endpoint + 'embed/' + video.id + '.json';
      var uri = new URI(url_base);
      uri.addSearch({
        autoplay: this.settings.autoplay
      });
 
      if (!app.settingsParams.IAP && typeof accessToken !== 'undefined' && accessToken) {
        uri.addSearch({ access_token: accessToken });
      }
      else if (app.settingsParams.IAP) {
        var consumer = iapHandler.state.currentConsumer;
 
        if (typeof consumer !== 'undefined' && consumer && consumer.access_token) {
          uri.addSearch({
            access_token: consumer.access_token
          });
        }
      }
      else {
        uri.addSearch({ app_key: app.settingsParams.app_key });
      }
 
      $.ajax({
        url: uri.href(),
        context: this,
        type: 'GET',
        dataType: 'json',
        success: function(player_json) {
          // set the url and format for the upcoming video
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
          }
          this.startNextVideo();
        },
        error: function() {
          this.handleVideoError();
          alert('Error: Unable to play next video. Please try again.');
          this.exit();
        }
      });
    };
 
    this.showTransitionView = function() {
      console.log("show transition view");
      if (this.items.length > this.currentIndex + 1) {
        this.previewShowing = true;
        var html = utils.buildTemplate($("#next-video-view-template"), this.items[this.currentIndex + 1]);
        this.$el.append(html);
        this.$previewEl = this.$el.children().last();
        this.$countdown_text = this.$previewEl.find(".next-video-starttext");
        this.$countdown_text.text("" + this.previewTime);
      }
    };

    /**
     * start the next video after the transition view is complete
     */
    this.startNextVideo = function() {
      this.currentIndex += 1;
      this.previewShowing = false;
      this.previewDismissed = false;

      this.trigger('indexChange', this.currentIndex);

      // Remove existing current player
      this.currentView = null; // remove reference
      this.currentPlayerView.off();
      this.currentPlayerView.remove();
      this.currentPlayerView = null;

      // Create new player
      this.currentPlayerView = new this.PlayerView(settings);

      // Events
      this.currentPlayerView.on('videoStatus', this.handleVideoStatus, this);
      this.currentPlayerView.on('exit', this.exit, this);

      // Render
      this.currentPlayerView.render(this.$el, this.items, this.currentIndex);

      // Set current view
      this.currentView = this.currentPlayerView;

      if (this.currentPlayerView.canplay) {
        this.currentPlayerView.playVideo();
      }
    };
  
    /**
     * @function handleVideoStatus
     * @description status handler for video status events to convert them into showing correct controls
     */
    this.handleVideoStatus = function(currentTime, duration, type) {
      if (type === "playing") {
        if (this.previewShowing) {
          this.timeTillPlay = Math.round((duration - currentTime));
          this.$countdown_text.text("" + this.timeTillPlay);
        } else if (duration - currentTime <= this.previewTime) {
          // fix bug if the currentTime is 0 at start of the video
          if (currentTime > 0) {
            this.showTransitionView();
          }
        }
      }
 
      if (type === "ended") {
        this.verifyNextVideo();
      } else {
        this.trigger('videoStatus', currentTime, duration, type);
      }
    }.bind(this);
 
    /**
     * Handle video errors
     */
    this.handleVideoError = function() {
      this.trigger('videoError');
    };
 
    /**
     * Cleanup and exit the playlist/player/next video view
     */
    this.exit = function() {
      this.trigger("exit");
    };
 
    this.playVideo = function() {
      this.currentPlayerView.playVideo();
    };
 
    /**
     * Check to see if we have a seek action
     * @param {Number} key the keyCode of the event
     * @return {Boolean}
     */
    this.seekAction = function(key) {
      if (key === buttons.UP || key === buttons.DOWN || key === buttons.LEFT ||
        key === buttons.RIGHT || key === buttons.FAST_FORWARD || key === buttons.REWIND) {
 
        return true;
      }
      return false;
    };
 
    // handle button events, send them to the current playlist view that is selected.
    this.handleControls = function(e) {
      if (this.currentView) {
        if (this.previewShowing && !this.previewDismissed && !this.seekAction(e.keyCode)) {
          switch (e.keyCode) {
            case buttons.BACK:
              this.$previewEl.remove();
              this.previewDismissed = true;
              break;
            case buttons.SELECT:
              this.verifyNextVideo();
              break;
            case buttons.PLAY_PAUSE:
              this.currentView.handleControls(e);
              break;
          }
        } else {
          this.currentView.handleControls(e);
        }
      }
    }.bind(this);
  };
 
  exports.PlaylistPlayerView = PlaylistPlayerView;
}(window));
