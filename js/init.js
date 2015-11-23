(function(exports) {
    'use strict';

    var settings = {
        Model: JSONMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        endpoint: "https://api.zype.com/",
        player_endpoint: "https://player.zype.com/"
        app_key: "<APP KEY>",
    };

    // add the dynamic settings
    $.ajax({
        url: settings.endpoint + "app/?app_key=" + settings.app_key,
        type: 'GET',
        dataType: 'json',
        cache : true,
        success: function(app_json) {
          // set dynamic from the api
          settings.category_id = app_json.response.category_id;
          settings.playlist_id = app_json.response.featured_playlist_id;
          settings.per_page = app_json.response.per_page;
          settings.avod = app_json.response.avod;

          // main colors
          settings.backgroundColor = app_json.response.background_color;
          settings.topBarColor = app_json.response.top_bar_color;
          settings.textColor = app_json.response.text_color;
          settings.mutedTextColor =app_json.response.muted_text_color;
          settings.brandColor = app_json.response.brand_color;

          // navigation colors
          settings.leftNavBackgroundColor = app_json.response.left_nav_background_color;
          settings.leftNavTextColor = app_json.response.left_nav_text_color;
          settings.leftNavHoverTextColor = app_json.response.left_nav_hover_text_color;
          settings.leftNavHoverBackgroundColor = app_json.response.left_nav_hover_background_color;

          // icon
          settings.icon = app_json.response.logo_medium_url;
          settings.iconXPosition = app_json.response.icon_x_position + 'px';
          settings.iconYPosition =  app_json.response.icon_y_position + 'px';

          var app = new App(settings);
          exports.app = app;
        },
        error:function() {
          alert("There was an error configuring your Fire TV App. Please exit.")
            console.log(arguments);
        }
    });
}(window));
