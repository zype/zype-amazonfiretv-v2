(function(exports) {
  'use strict';

  var settings = {
    Model:           JSONMediaModel,
    PlayerView:      PlayerView,
    PlaylistView:    PlaylistPlayerView,
    showSearch:      true,
    app_key:         appConfig.app_key,
    client_id:       appConfig.client_id,
    client_secret:   appConfig.client_secret,
    endpoint:        appConfig.endpoint,
    player_endpoint: appConfig.player_endpoint,
    device_id:       null,
    linked:          false,
    browse:          false,
    watchAVOD:       false
  };

  var initApp = function(settings) {
    iapHandler.settingsParams = settings;
    deviceLinkingHandler.settingsParams = settings;

    if (settings.IAP === true) {
      iapHandler.iapInit();
    }

    // Device Linking Pre-Setup
    if (settings.device_linking === true) {
      settings.device_id = deviceLinkingHandler.getDeviceId();
      if (settings.device_id === null || !settings.device_id) {
        settings.device_id = deviceLinkingHandler.setDeviceId();
      }

      // we need to guarantee that the device id is available
      if (!(typeof settings.device_id === "string" && settings.device_id.length > 0)) {
        alert("There was an error configuring your Fire TV App. Please exit.");
        app.exit();
      }
    }

    var app = new App(settings);
    exports.app = app;
  };

  // add the dynamic settings
  $.ajax({
    url: settings.endpoint + "app/?app_key=" + settings.app_key,
    type: 'GET',
    dataType: 'json',
    cache: false,
    success: function(app_json) {
      var res = app_json.response;

      // Main
      settings.category_id          = res.category_id;
      settings.playlist_id          = res.featured_playlist_id;
      settings.playlist_ids         = null;
      settings.autoplay             = res.autoplay;
      settings.per_page             = res.per_page;
      settings.nested_categories    = res.nested;
      settings.playlists_only       = res.playlists_only; // use PLs, remove Categories. Includes PLs in place of "Nested Categories".
      
      // Monetization
      settings.avod                 = res.avod;
      settings.IAP                  = res.in_app_purchase;
      settings.device_linking       = res.device_linking;
      settings.device_link_url      = res.device_link_url;
      settings.entitlements         = res.entitlements;
      settings.subscribe_no_ads     = res.subscribe_no_ads;

      // Video Features
      settings.limit_videos_by_time = res.limit_videos_by_time;
      settings.subscribe_no_limit_videos_by_time = res.subscribe_no_limit_videos_by_time;
      settings.videos_time_limited  = res.videos_time_limited; // array of objects

      // Theme and Images
      settings.theme                = 'theme--' + res.theme; // 'light' or 'dark'
      settings.logoPosition         = 'logo--' + res.logo_position; // 'center' or 'right'
      settings.displayButtons       = true; // this should be true
      settings.slider               = res.slider;
      settings.related_images       = res.related_images; // use related images for video thumbnails
      settings.related_images_title = res.related_images_title;
      settings.default_image_url    = (res.default_image_url) ? res.default_image_url : './assets/default-image.png';


      //* For Testing
      // settings.nested_categories = true;
      // settings.playlists_only = true;

      // settings.IAP = false;
      // settings.device_linking = true;
      // settings.entitlements = true;
      // settings.subscribe_no_ads = true;

      // settings.limit_videos_by_time = true;
      // settings.subscribe_no_time_limit = true;
      // settings.videos_time_limited = [
      //   {
      //     id : '',
      //     time_limit   : 10, // seconds
      //     time_watched : 0,
      //     watched      : false
      //   }
      // ];

      // settings.theme = 'theme--dark';
      // settings.theme = 'theme--light';
      // settings.logoPosition = 'logo--center';
      // settings.logoPosition = 'logo--right';
      // settings.slider = true;
      // settings.related_images = true;
      // settings.related_images_title = 'film-poster';
      //* For Testing


      // Navigation
      settings.nav = {};
      settings.nav.home     = (settings.nested_categories) ? 0 : null;
      settings.nav.search   = (settings.nested_categories) ? 1 : 0;
      settings.nav.library  = null;
      settings.nav.playlist = settings.nav.search + 1;
      settings.nav.category = settings.nav.playlist + 1;

      //* Super User

      // main colors
      settings.backgroundColor = res.background_color;
      settings.textColor       = res.text_color;
      settings.mutedTextColor  = res.muted_text_color;
      settings.brandColor      = res.brand_color;

      // navigation colors
      settings.topBarColor                 = res.top_bar_color;
      settings.leftNavBackgroundColor      = res.left_nav_background_color;
      settings.leftNavTextColor            = res.left_nav_text_color;
      settings.leftNavHoverTextColor       = res.left_nav_hover_text_color;
      settings.leftNavHoverBackgroundColor = res.left_nav_hover_background_color;

      // icon
      settings.icon          = utils.makeSSL(res.logo_original_url);
      settings.iconXPosition = res.icon_x_position + 'px';
      settings.iconYPosition = res.icon_y_position + 'px';

      console.log('waiting for amazonPlatformReady...');

      // when amazon platform is ready, start the app
      document.addEventListener("amazonPlatformReady", function() {
        console.log('amazonPlatformReady!');
        initApp(settings);
      });

      // uncomment to test on the browser
      // initApp(settings);
    },
    error: function() {
      alert("There was an error configuring your Fire TV App. Please exit.");
      console.log(arguments);
      app.exit();
    }
  });
}(window));
