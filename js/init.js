(function(exports) {
    'use strict';

    var settings = {
        Model: JSONMediaModel,
        PlayerView: PlayerView,
        PlaylistView: PlaylistPlayerView,
        showSearch: true,
        key: "<API KEY>",
        app: "<APP KEY>",
        endpoint: "https://api.zype.com/",
        player_endpoint: "https://player.zype.com/"
    };

    // add the dynamic settings
    $.ajax({
        url: settings.endpoint + "app/?app_key=" + settings.app,
        type: 'GET',
        dataType: 'json',
        cache : true,
        success: function(app_json) {
          // set dynamic from the api
          settings.category_id = app_json.response.category_id;
          settings.playlist_id = app_json.response.featured_playlist_id;
          settings.per_page = app_json.response.per_page;
          settings.avod = true;

          // main colors
          settings.backgroundColor = '#3d4550';
          settings.topBarColor = '#000000';
          settings.textColor = '#ffffff';
          settings.mutedTextColor ='#b9bbbd';
          settings.brandColor = '#b6cc28';

          // navigation colors
          settings.leftNavBackgroundColor = '#000000';
          settings.leftNavTextColor = '#ffffff';
          settings.leftNavHoverTextColor = '#000000';
          settings.leftNavHoverBackgroundColor = '#ffffff';


          // icon
          settings.icon = app_json.response.app_images[1].logo_hd;
          settings.iconXPosition = '150' + 'px';
          settings.iconYPosition =  '40' + 'px';

          var app = new App(settings);
          exports.app = app;
        },
        error:function() {
          alert("There was an error configuring your Fire TV App. Please exit.")
            console.log(arguments);
        }
    });
}(window));
