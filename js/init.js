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

  function initApp(settings) {
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

    // Initialize Custom Styles
    createStyleSheet();
    setBodyClasses();

    var app = new App(settings);
    exports.app = app;
  };

  // overrides css with configs
  function createStyleSheet() {
    var style = document.createElement('style');
    var rules = [
      // Loading Indicator
      '.content-load-spinner { border-right-color: ' + settings.brandColor + '; }',
      '.content-load-spinner { border-bottom-color: ' + settings.brandColor + '; }',
      '.content-load-spinner { border-left-color: ' + settings.brandColor + '; }',
      // Navigation
      '#left-nav-menu-icon.leftnav-menu-icon-highlight .menu-line { background: ' + settings.brandColor + '; }',
      '.leftnav-menu-list { border-color: ' + settings.brandColor + '; }',
      '.leftnav-list-item-highlighted { color: ' + settings.brandColor + '; }',
      '.leftnav-list-item-static.leftnav-list-item-selected { color: ' + settings.brandColor + '; }',
      // Search
      '.leftnav-search-box.leftnav-list-item-selected { color: ' + settings.brandColor + '; }',
      '.leftnav-search-box:focus::-webkit-input-placeholder { color: ' + settings.brandColor + '; }',
      '.leftnav-search-box:focus:-moz-placeholder { color: ' + settings.brandColor + '; }',
      '.leftnav-search-box:focus::-moz-placeholder { color: ' + settings.brandColor + '; }',
      '.leftnav-search-box:focus:-ms-input-placeholder { color: ' + settings.brandColor +'; }',
      // Buttons
      '.detail-item-button.detail-item-button-static { border-color: ' + settings.brandColor + '; }',
      '.detail-item-button.detail-item-button-selected { background: ' + settings.brandColor + '; border-color: ' + settings.brandColor + '; }',
      // Slider Pagination
      '.circle-current { background: ' + settings.brandColor + '; border-color: ' + settings.brandColor + '; }',
    ];

    rules = rules.join('');

    style.appendChild(document.createTextNode(rules));

    document.getElementsByTagName('head')[0].appendChild(style);
  };

  /**
   * Set the body classes based on API configs
   */
  function setBodyClasses() {
    var body = document.getElementsByTagName('body')[0];
    var bodyClasses = [];

    bodyClasses.push(settings.theme);
    bodyClasses.push(settings.logoPosition);

    for (var i = 0; i < bodyClasses.length; i++) {
      body.classList.add(bodyClasses[i]);
    }
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
      settings.category_id       = res.category_id;
      settings.playlist_id       = res.featured_playlist_id;
      settings.playlist_ids      = null;
      settings.root_playlist_id  = res.featured_playlist_id;
      settings.autoplay          = res.autoplay;
      settings.per_page          = res.per_page;
      settings.playlists_only    = true; // Enhanced Playlists
      settings.about             = res.about_page;

      // Monetization
      settings.IAP                      = res.in_app_purchase;
      settings.device_linking           = res.device_linking;
      settings.device_link_url          = res.device_link_url;
      settings.entitlements             = res.entitlements;
      settings.subscribe_no_ads         = res.subscribe_no_ads;
      settings.subscribe_no_ads_silent  = res.subscribe_no_ads_silent;
      settings.subscribe_no_limit_videos_by_time = res.subscribe_no_limit_videos_by_time;

      // Video Features
      settings.limit_videos_by_time = res.limit_videos_by_time;
      settings.videos_time_limited  = res.videos_time_limited; // array of objects
      settings.video_favorties      = res.favoriting;

      // Theme and Images
      settings.theme                = 'theme--' + res.theme; // 'light' or 'dark'
      settings.logoPosition         = 'logo--' + res.logo_position; // 'center' or 'right'
      settings.displayButtons       = true; // this should be true
      settings.slider               = res.slider_images_enabled;
      settings.related_images       = res.related_images; // use related images for video thumbnails
      settings.related_images_title = res.related_images_title;
      settings.default_image_url    = (res.default_image_url) ? res.default_image_url : './assets/default-image.png';
      settings.device_linking_title = (res.device_linking_header) ? res.device_linking_header : 'Link Your Fire TV';
      settings.device_linking_copy  = (res.device_linking_copy) ? res.device_linking_copy : '';

      //* For Testing
      // settings.playlists_only = true;
      // settings.root_playlist_id = '';
      // settings.about = 'About Page Text';
      // settings.related_images = true;
      // settings.related_images_title = 'film-poster';
      // settings.limit_videos_by_time = true;
      // settings.subscribe_no_time_limit = true;
      // settings.videos_time_limited = [
      //   {
      //     id : '',
      //     time_limit   : 20, // seconds
      //     time_watched : 0,
      //     watched      : false
      //   }
      // ];
      // settings.video_favorites = true;
      // settings.subscribe_no_limit_videos_by_time = true;

      // settings.IAP = false;
      // settings.device_linking = true;
      // settings.entitlements = true;
      // settings.subscribe_no_ads = true;
      // settings.subscribe_no_ads_silent = true;

      // settings.slider = true;
      // settings.theme = 'theme--dark';
      // settings.theme = 'theme--light';
      // settings.logoPosition = 'logo--center';
      // settings.logoPosition = 'logo--right';
      // settings.device_linking_title = '';
      // settings.device_linking_copy = '';
      
      // Navigation
      settings.nav = {};
      settings.nav.home      = (settings.playlists_only) ? 0 : null;
      settings.nav.search    = (settings.playlists_only) ? 1 : 0;
      settings.nav.favorites = null;
      settings.nav.library   = null;
      settings.nav.about     = null;
      settings.nav.playlist  = settings.nav.search + 1;
      settings.nav.category  = settings.nav.playlist + 1;

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
