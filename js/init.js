(function(exports) {
  'use strict';

  var settings = {
    Model: JSONMediaModel,
    PlayerView: PlayerView,
    PlaylistView: PlaylistPlayerView,
    showSearch: true,
    app_key: appConfig.app_key,
    client_id: appConfig.client_id,
    client_secret: appConfig.client_secret,
    endpoint: appConfig.endpoint,
    player_endpoint: appConfig.player_endpoint,
    device_id: null,
    linked: false
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
      // set dynamic from the api
      settings.category_id = app_json.response.category_id;
      settings.playlist_id = app_json.response.featured_playlist_id;
      settings.per_page = app_json.response.per_page;

      settings.avod = app_json.response.avod;
      settings.IAP = app_json.response.in_app_purchase;
      settings.subscribe_to_watch_ad_free = app_json.response.subscribe_to_watch_ad_free;
      settings.autoplay = app_json.response.autoplay;
      settings.nested_categories = app_json.response.nested;

      settings.device_linking = app_json.response.device_linking;
      settings.device_link_url = app_json.response.device_link_url;

      // this should be true
      settings.displayButtons = true;

      // for testing only
      // settings.IAP = false;
      // settings.device_linking = true;
      // settings.theme = 'theme--dark';
      // settings.theme = 'theme--light';
      // settings.logoPosition = 'logo--center';
      // settings.logoPosition = 'logo--right';

      // theme
      settings.theme = 'theme--' + app_json.response.theme; // 'light' or 'dark'

      // logo position
      settings.logoPosition = 'logo--' + app_json.response.logo_position; // 'center' or 'right'

      // main colors
      settings.backgroundColor = app_json.response.background_color;
      settings.textColor = app_json.response.text_color;
      settings.mutedTextColor = app_json.response.muted_text_color;
      settings.brandColor = app_json.response.brand_color;

      // navigation colors
      settings.topBarColor = app_json.response.top_bar_color;
      settings.leftNavBackgroundColor = app_json.response.left_nav_background_color;
      settings.leftNavTextColor = app_json.response.left_nav_text_color;
      settings.leftNavHoverTextColor = app_json.response.left_nav_hover_text_color;
      settings.leftNavHoverBackgroundColor = app_json.response.left_nav_hover_background_color;

      // icon
      settings.icon = utils.makeSSL(app_json.response.logo_original_url);
      settings.iconXPosition = app_json.response.icon_x_position + 'px';
      settings.iconYPosition = app_json.response.icon_y_position + 'px';

      // use related images for video thumbnails
      settings.related_images = app_json.response.related_images; // boolean

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
