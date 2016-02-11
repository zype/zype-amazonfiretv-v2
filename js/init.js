(function(exports) {
  'use strict';

  var settings = {
    Model: JSONMediaModel,
    PlayerView: PlayerView,
    PlaylistView: PlaylistPlayerView,
    showSearch: true,
    app_key: appConfig.app_key,
    endpoint: appConfig.endpoint,
    player_endpoint: appConfig.player_endpoint,
    device_id: "00000000-0000-0000-0000-000000000000",
    linking_url: "http://www.example.com"
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
      if (settings.device_id === null) {
        settings.device_id = deviceLinkingHandler.setDeviceId();
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
      settings.autoplay = app_json.response.autoplay;
      settings.nested_categories = app_json.response.nested;

      // this should be true
      settings.displayButtons = true;


      // @TODO fix me

      // Device Linking Settings
      // should come from API
      settings.device_linking = true;


      // main colors
      // settings.backgroundColor = app_json.response.background_color;
      // settings.topBarColor = app_json.response.top_bar_color;
      // settings.textColor = app_json.response.text_color;
      // settings.mutedTextColor =app_json.response.muted_text_color;
      // settings.brandColor = app_json.response.brand_color;
      //
      // navigation colors
      // settings.leftNavBackgroundColor = app_json.response.left_nav_background_color;
      // settings.leftNavTextColor = app_json.response.left_nav_text_color;
      // settings.leftNavHoverTextColor = app_json.response.left_nav_hover_text_color;
      // settings.leftNavHoverBackgroundColor = app_json.response.left_nav_hover_background_color;

      // icon
      settings.icon = utils.makeSSL(app_json.response.logo_original_url);
      settings.iconXPosition = app_json.response.icon_x_position + 'px';
      settings.iconYPosition = app_json.response.icon_y_position + 'px';

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
    }
  });
}(window));
