/* Player View
 *
 * Handles the media playback
 *
 */

(function(exports) {
  "use strict";

  /**
   * @class PlayerView
   * @description The detail view object, this handles everything about the detail view.
   */
  var PlayerView = function(settings) {
    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['exit', 'videoStatus', 'videoError', 'indexChange']);

    //jquery constants
    this.$el = null;
    this.$currSeekTime = null;
    this.canplay = null;
    this.controlsView = null;
    this.durationFound = false;

    // class variables
    this.fullscreenOpen = false;
    this.currentVideo = null;

    /**
     * Creates the main content view from the template and appends it to the given element
     */
    this.render = function($container, items, index, playerJson) {
      // Build the main content template and add it
      var video = items[index];
      this.currentVideo = video;

      // to ensure that the video is unique for vidjs
      var d = new Date();
      var seconds = d.getTime().toString();

      var html = utils.buildTemplate($("#player-view-template"), video);
      $container.append(html);
      this.$el = $container.children().last();

      this.$containerControls = $container.find(".player-controls-container");
      this.containerControls = this.$containerControls[0];

      // create the video element
      this.videoElement = document.createElement('video');
      this.videoElement.className = 'player-content-video video-js vjs-default-skin';
      this.videoElement.id = 'zype_' + video.id.toString() + '-' + seconds;
      this.videoElement.poster = video.thumbURL;
      this.videoElement.preload = 'auto';
      this.videoElement.height = 1080;
      this.videoElement.width = 1920;

      // add the source
      var source = document.createElement('source');
      source.src = utils.makeSSL(video.url);
      source.type = video.format;
      this.videoElement.appendChild(source);

      this.$el.append(this.videoElement);

      // event listeners
      this.videoElement.addEventListener("canplay", this.canPlayHandler);
      this.videoElement.addEventListener("ended", this.videoEndedHandler);
      this.videoElement.addEventListener("timeupdate", this.timeUpdateHandler);
      this.videoElement.addEventListener("error", this.errorHandler);
      this.videoElement.addEventListener('durationchange', this.durationChangeHandler);

      //listener for visual on video playback only - remove for non-visual on implementation
      this.videoElement.addEventListener(utils.vendorPrefix('fullscreenchange').toLowerCase(), this.fullScreenChangeHandler);

      // VideoJS reference
      var vid = videojs('zype_' + video.id.toString() + '-' + seconds);

      // add Akamai analytics
      vid.akamaiAnalytics({
        config: playerJson.analytics.beacon
      });

      // add custom videoData
      vid.videoData = {
        title     : video.title,
        device    : playerJson.analytics.dimensions.device,
        site_id   : playerJson.analytics.dimensions.site_id,
        player_id : playerJson.analytics.dimensions.player_id,
        video_id  : playerJson.analytics.dimensions.video_id
      };

      // Ads
      if (video.ad_schedule.length === 0 || (settings.subscribe_no_ads && settings.device_linking && settings.linked === true)) {
        playedAd = true;
      }
      else {
        /**
         * Here we provide an ad tag, but we want to be sure that
         * we do not have an empty XML response.
         */
        console.log('getting ad');
        playedAd = false;
        var ad_tag = null;

        if (video.ad_schedule[0].hasOwnProperty("tag")) {
          ad_tag = new URI(video.ad_schedule[0].tag).href();
        } else {
          ad_tag = "";
        }
        
        vid.ads();
        vid.vast({
          url: ad_tag
        });
      }

      // create controls
      this.controlsView = new ControlsView();
      this.controlsView.render(this.$el, video, this);
    };

    /**
     * Handler for video 'canplay' event
     */
    this.canPlayHandler = function() {
      this.canplay = true;
      this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'canplay');
    }.bind(this);

    /**
     * Handler for durationFound event
     */
    this.durationFoundHandler = function() {
      this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
      this.trigger('videoStarted');
    }.bind(this);

    /**
     * Handler for video 'ended' event
     */
    this.videoEndedHandler = function() {
      if (playedAd) {
        this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'ended');
      } else {
        this.controlsView.showAndHideControls();
        playedAd = true;
      }
    }.bind(this);

    /**
     * Video On Event handler ONLY
     * This is the handler for the webkitfullscreen event
     * For non-visual on implimentations you can remove this method
     * as well as the event listener in the render function
     */
    this.fullScreenChangeHandler = function() {
      if (this.fullscreenOpen) {
        this.videoEndedHandler();
        this.fullscreenOpen = false;
      } else {
        this.fullscreenOpen = true;
      }
    }.bind(this);

    /*
     * Handler for the 'durationchange' event
     */
    this.durationChangeHandler = function() {
      if (this.videoElement.duration && this.videoElement.duration > 0) {
        this.durationFound = true;
      }
    }.bind(this);

    /*
     * Handler for the 'timeupdate' event
     */
    this.timeUpdateHandler = function() {
      if (playedAd) {
        this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
      }
    }.bind(this);

    /*
     * Handler for the media 'error' event
     */
    this.errorHandler = function(e) {
      var errorType;
      if (e && e.target.error && e.target.error.code) {
        switch (e.target.error.code) {
          case e.target.error.MEDIA_ERR_ABORTED:
          case e.target.error.MEDIA_ERR_NETWORK:
            errorType = 'network';
            break;
          case e.target.error.MEDIA_ERR_DECODE:
          case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorType = 'content';
            break;
          default:
            errorType = 'unknown';
            break;
        }
      } else {
        // no error code, default to unknown type
        errorType = 'unknown';
      }
      this.trigger('videoError', errorType);
    }.bind(this);

    /**
     * Remove the video element from the app
     */
    this.remove = function() {
      if (this.videoElement) {
        this.videoElement.pause();
      }
      if (this.controlsView) {
        this.controlsView.remove();  
      }
      if (this.$el) {
        this.$el.remove();  
      }
    };

    /**
     * Hides the video
     */
    this.hide = function() {
      this.$el.css("visibility", "hidden");
    };

    /**
     * show the video
     */
    this.show = function() {
      this.$el.css("visibility", "");
      if (this.durationFound) {
        this.controlsView.showAndHideControls();
      }
    };

    /**
     * @function playVideo
     * @description start the video playing
     */
    this.playVideo = function() {
      this.videoElement.play();
      this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
    };

    /**
     * @function pauseVideo
     * @description pause the currently playing video, called when app loses focus
     */
    this.pauseVideo = function() {
      if (playedAd) {
        this.videoElement.pause();
        this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'paused');
      }
    };

    /**
     * @function resumeVideo
     * @description resume the currently playing video, called when app regains focus
     */
    this.resumeVideo = function() {
      this.videoElement.play();
      this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'resumed');
    };

    /**
     * @function seekVideo
     * @description navigate to a position in the video
     */
    this.seekVideo = function(position) {
      if (playedAd) {
        this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'playing');
        this.videoElement.currentTime = position;
        this.trigger('videoStatus', this.videoElement.currentTime, this.videoElement.duration, 'seeking');
      }
    };

    // handle button events, connected to video API for a few operations
    this.handleControls = function(e) {
      if (playedAd) {
        if (e.type !== 'buttonpress' && e.type !== 'touch') {
          return;
        }

        switch (e.keyCode) {
          case buttons.BACK:
            this.trigger('exit');
            break;

          case buttons.LEFT:
          case buttons.REWIND:
            this.seekVideo(this.videoElement.currentTime - 30);
            break;

          case buttons.RIGHT:
          case buttons.FAST_FORWARD:
            this.seekVideo(this.videoElement.currentTime + 30);
            break;

          case buttons.SELECT:
          case buttons.PLAY_PAUSE:
            if (this.videoElement.paused) {
              this.resumeVideo();
            } else {
              this.pauseVideo();
            }
            break;
          case buttons.UP:
            this.controlsView.showAndHideControls();
            break;
          case buttons.DOWN:
            if (!this.videoElement.paused) {
              this.controlsView.hide();
            }
            break;
        }
      } else {
        if (e.type !== 'buttonpress' && e.type !== 'touch') {
          return;
        }

        switch (e.keyCode) {
          case buttons.BACK:
            this.trigger('exit');
            break;
        }
      }
    }.bind(this);

    /**
     * @function handleClosedCaptioning
     * @description if closed caption tracks are available, display options to enable and select them
     */
    this.handleClosedCaptioning = function(tracks) {
      // TODO: we likely will move this out and make the options part of the controls, however for now we
      //  default to the first track if available
      if (tracks && tracks.length > 0) {
        var trackElement = document.createElement('track');
        var track = tracks[0]; // temporarily default to the first track
        trackElement.src = track.src;
        trackElement.label = track.label || "";
        trackElement.kind = track.kind || "subtitles";
        trackElement.srclang = track.srclang || window.navigator.language;
        trackElement.default = true;
        this.videoElement.appendChild(trackElement);
      }
    };

  };

  exports.PlayerView = PlayerView;
}(window));
