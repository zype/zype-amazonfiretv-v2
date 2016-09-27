/* Model
 *
 * Model for JSON data
 */

(function(exports) {
  "use strict";

  // the model for the Media Sample Data
  // @param {Object} appSettings are the user-defined settings from the index page
  var JSONMediaModel = function(appSettings) {
    this.settingsParams = appSettings;
    this.categoryData = [];
    this.categoryTitle = "";
    this.currData = [];
    this.currentCategory = 0;
    this.currentItem = 0;
    this.plans = [];

    this.channelsData = [];
    this.currentChannel = 0;

    this.zobjectData = [];
    this.sliderData = [];
    this.entitlementData = {};
    this.currVideoTimedIndex = null; // current timed video's index
    this.videoTimerId = null; // current timed video's timer reference

    /**
     * This function loads the initial data needed to start the app and calls the provided callback with the data when it is fully loaded
     * @param {function} the callback function to call with the loaded data
     */

    this.loadData = function(dataLoadedCallback) {
      // Important to load any plans as the IAP handler will need to have those available.
      var that = this;

      that.categoryData = [];
      that.categoryTitle = "";
      that.currData = [];
      that.currentCategory = 0;
      that.currentItem = 0;
      that.plans = [];
      that.channelsData = [];
      that.zobjectData = [];
      that.sliderData = [];

      this.getPlans(function(plans) {
        that.plans = plans;
        if (that.settingsParams.playlists_only && !that.settingsParams.nested_categories) {
          that.loadAllPlaylistData(dataLoadedCallback);
        }
        else if (that.settingsParams.playlists_only && that.settingsParams.nested_categories) {
          that.loadPlaylistData(dataLoadedCallback, that.settingsParams.playlist_ids);
        }
        else {
          that.loadCategoryData(dataLoadedCallback);  
        }
      });

    }.bind(this);

    /**
     * Load ZObject Data
     *
     * @param {Function} the callback function
     * @param {Number}   the number of times the ajax request has failed
     */
    this.loadZObjectData = function(callback, fail) {
      var fail  = fail || 0;
      var retry = 1;

      $.ajax({
        url: this.settingsParams.endpoint + "zobjects/?zobject_type=slider&app_key=" + this.settingsParams.app_key,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        success: function() {
          var data = arguments[0].response;

          for (var i = 0; i < data.length; i++) {
            this.zobjectData.push({
              id: data[i].video_ids[0],
              title: data[i].title,
              desc: data[i].description,
              thumbnail: utils.makeSSL(data[i].pictures[0].url)
            });
          }

          if (this.zobjectData.length > 0) {
            return this.loadSliderVideoDetails(this.zobjectData, callback);
          }
          return callback();
        },
        error: function() {
          console.log('loadZObjectData.error');
          if (fail < retry) {
            fail++;
            return this.loadZObjectData(callback, fail);
          }
          return callback();
        }
      });
    };

    /**
     * Load Slider Video Details (recursive)
     *
     * @param {Array}    the ZObject Data
     * @param {Function} the callback function
     * @param {Number}   the starting index (optional)
     * @param {Number}   the number of times the ajax request has failed
     */
    this.loadSliderVideoDetails = function(zobjectData, callback, counter, fail) {
      var j         = counter || 0;
      var fail      = fail || 0;
      var retry     = 1;
      var video_id  = (zobjectData[j].id) ? zobjectData[j].id : null;
      var title     = zobjectData[j].title;
      var desc      = zobjectData[j].desc;
      var thumbnail = zobjectData[j].thumbnail;

      // If Video ID exists, get video data
      if (video_id) {
        $.ajax({
          url: this.settingsParams.endpoint + "videos/" + video_id + "?app_key=" + this.settingsParams.app_key,
          type: 'GET',
          crossDomain: true,
          dataType: 'json',
          context: this,
          cache: true,
          success: function() {
            var video = arguments[0].response;
            var args = {
              "id": video._id,
              "title": title,
              "pubDate": video.published_at,
              "thumbURL": thumbnail,
              "imgURL": thumbnail,
              // parse videoURL at playtime
              "description": desc,
              "seconds": video.duration,
              "subscription_required": video.subscription_required,
              "rental_required": video.rental_required,
              "purchase_required": video.purchase_required,
              "pass_required": video.pass_required
            };

            var formatted_video = new Video(args);

            this.sliderData.push(formatted_video);

            if (j < (zobjectData.length - 1)) {
              j++;
              return this.loadSliderVideoDetails(zobjectData, callback, j, 0);
            }
            return callback();
          },
          error: function(xhr) {
            console.log('loadVideoDetails.error', xhr);
            // Retry current item
            if (fail < retry) {
              fail++;
              return this.loadSliderVideoDetails(zobjectData, callback, j, fail);
            }
            // Retry failed. Try next item
            else if (j < (zobjectData.length - 1)) {
              j++;
              return this.loadSliderVideoDetails(zobjectData, callback, j, 0);
            }
            return callback();
          }
        });
      }
      else {
        if (j < (zobjectData.length - 1)) {
          j++;
          return this.loadSliderVideoDetails(zobjectData, callback, j, 0);
        }
        return callback();
      }
    };

    /**
     * Loads the Featured Category data specified in the API. 
     * If none specified, createds a dummy category called "All Videos".
     */
    this.loadCategoryData = function(categoryDataLoadedCallback) {
      console.log('load.category.data');
      $.ajax({
        url: this.settingsParams.endpoint + "categories/" + this.settingsParams.category_id + "/?app_key=" + this.settingsParams.app_key,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        success: function() {
          var contentData = arguments[0];
          this.getCategoryRowValues(contentData);
        },
        error: function() {
          var contentData = {
            response: {
              title: 'Videos',
              values: ['All Videos']
            }
          };
          this.getCategoryRowValues(contentData);
        },
        complete: function() {
          this.loadAllPlaylistData(categoryDataLoadedCallback);
        }
      });
    };

    /**
     * Handles requests that contain json data
     * @param {Object} jsonData data returned from request
     */
    this.getCategoryRowValues = function(jsonData) {
      this.categoryData = jsonData.response.values;
      this.categoryTitle = jsonData.response.title;
    }.bind(this);

    /**
     * Load All Playlist Data
     * 
     * Loads either the Featured Playlist data or all Active Playlists data
     * 
     * @param {Function} the callback function
     */
    this.loadAllPlaylistData = function(categoryDataLoadedCallback) {
      console.log("load.playlist.data");

      var data = {};
      var url = this.settingsParams.endpoint + "playlists/";
      url += (!this.settingsParams.playlists_only) ? this.settingsParams.playlist_id : '';
      
      data['app_key']    = this.settingsParams.app_key;
      if (this.settingsParams.playlists_only) {
        data['per_page'] = 100;
        data['sort']     = 'priority';
        data['order']    = 'asc';
      }
      
      $.ajax({
        url: url,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        data: data,
        success: function(result) {
          var contentData = result;
          this.getPlaylistRowValues(contentData);
        },
        error: function() {
          var contentData = {
            response: {
              title: 'New Releases'
            }
          };
          this.getPlaylistRowValues(contentData);
        },
        complete: function() {
          if (this.settingsParams.slider) {
            return this.loadZObjectData(categoryDataLoadedCallback);  
          }
          return categoryDataLoadedCallback();
        }
      });
    };

    /**
     * Load Playlist data for the leftNavView recursively
     *
     * @param {Function} the callback function
     * @param {Array}    array of playlistIds from the selected ZObject
     * @param {Number}   the starting index
     * @param {Array}    the retrieved playlist data
     */
    this.loadPlaylistData = function(callback, playlistIds, counter, playlistData) {
      var j = counter || 0;
      var playlist_id = (playlistIds) ? playlistIds[j] : null;
      var playlistData = playlistData || [];

      // If an array of Playlist IDs is passed, get respective data recursively
      if (playlist_id) {
        $.ajax({
          url: this.settingsParams.endpoint + 'playlists/' + playlist_id,
          type: 'GET',
          crossDomain: true,
          dataType: 'json',
          context: this,
          cache: false,
          data: {
            'app_key' : this.settingsParams.app_key
          },
          success: function(result) {
            playlistData.push(result.response);

            if (j < (playlistIds.length - 1)) {
              j++;

              return this.loadPlaylistData(callback, playlistIds, j, playlistData);
            }

            // save the current playlist data in app.data.categoryData for leftNavView
            this.getPlaylistRowValues(playlistData);

            return (this.settingsParams.slider) ? this.loadZObjectData(callback) : callback();
          },
          error: function(xhr) {
            console.log('loadPlaylistData.error', xhr);

            // skip the failed playlist and load the next one
            if (j < (playlistIds.length - 1)) {
              j++;
              return this.loadPlaylistData(callback, playlistIds, j, playlistData);
            }
            
            // if error on last Playlist ID
            // save the current playlist data in app.data.categoryData for leftNavView
            this.getPlaylistRowValues(playlistData);

            return (this.settingsParams.slider) ? this.loadZObjectData(callback) : callback();
          }
        });
      }
      else {
        return (this.settingsParams.slider) ? this.loadZObjectData(callback) : callback();
      }
    };

    /**
     * Store Playlist data
     *
     * @param {object|array} jsonData data returned from request || array of Playlist objects
     */
    this.getPlaylistRowValues = function(jsonData) {
      if (this.settingsParams.playlists_only) {
        var playlists = jsonData.response || jsonData;
        var playlistData = [];

        for (var i = 0; i < playlists.length; i++) {
          playlistData.push({
            "title" : playlists[i].title,
            "id"    : playlists[i]._id
          });
        }
        this.categoryData = playlistData;
      }
      else {
        var playlistTitle = jsonData.response.title;
        this.categoryData.unshift(playlistTitle);
      }
    }.bind(this);

    /**
     * Load Entitlement data
     *
     * @param {string}   a valid Access Token
     * @param {function} the callback function
     */
    this.loadEntitlementData = function(accessToken, callback) {
      var resp;

      $.ajax({
        url: this.settingsParams.endpoint + "consumer/videos/",
        type: "GET",
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        data: {
          "access_token" : accessToken,
          "dpt" : true,
          "order" : "desc",
          "per_page" : this.settingsParams.per_page,
          "sort" : "created_at"
        },
        success: function(result) {
          resp = result;
        },
        error: function(xhr) {
          console.log('Error: loadEntitlementData', xhr);
        },
        complete: function() {
          callback(resp);
        }
      });
    };

    /**
     * Get video by ID
     * @param {string}   Video ID
     * @param {boolean}  Make an async or sync call
     * @param {function} The callback function
     */
    this.getVideoById = function(video_id, async, callback) {
      $.ajax({
        url: this.settingsParams.endpoint + "videos/" + video_id,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false,
        async: async,
        data: {
          "app_key" : this.settingsParams.app_key
        },
        success: function(result) {
          callback(result);
        },
        error: function(xhr) {
          console.log('error', xhr);
        }
      });
    };

    /**
     * Load plans from api
     */
    this.getPlans = function(callback) {
      Plan.getPlans(this.settingsParams, callback);
    };

    /**
     * Get the nested categories data
     * @param {function} the callback function
     */
    this.getCategories = function(callback) {
      $.ajax({
        url: this.settingsParams.endpoint + "zobjects/?app_key=" + this.settingsParams.app_key + "&zobject_type=channels&per_page=100&sort=priority&order=asc",
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        success: function() {
          var contentData = arguments[0];
          this.formatCategories(contentData);
        },
        error: function() {
          console.log(arguments);
          alert("There was an error configuring your Fire TV App. Please exit.");
          app.exit();
        },
        complete: function() {
          console.log('loadData.complete');
          callback(this.channelsData);
        }
      });
    };

    this.formatCategories = function(jsonData) {
      var data = jsonData.response;
      var formattedChannel = [];
      for (var i = 0; i < data.length; i++) {
        var pl_ids = data[i].playlist_id;

        // parse comma-separated playlist IDs into an array
        if (this.settingsParams.playlists_only && this.settingsParams.nested_categories && pl_ids.indexOf(',' > -1)) {
          pl_ids = pl_ids.split(',');

          // trim whitespace of each item in the array
          for (var j = 0; j < pl_ids.length; j++) {
            pl_ids[j] = pl_ids[j].trim();
          }
        }
        
        var args = {
          id: data[i]._id,
          title: data[i].title,
          playlist_id: data[i].playlist_id,
          category_id: data[i].category_id,
          description: data[i].description,
          playlist_ids: pl_ids
        };
        if (data[i].pictures && data[i].pictures.length > 0) {
          args.imgUrl = utils.makeSSL(data[i].pictures[0].url);
        }
        // Channel (Channels) is a ZObject based item
        var formatted_channel = new Channel(args);
        formattedChannel.push(formatted_channel);
      }
      // this push the channels to the channelsData and currData
      // (Channel model is almost the same as Video)
      this.channelsData = formattedChannel;
    };

    this.setcurrentChannel = function(index) {
      this.currentChannel = index;
    };

    this.setCategoryId = function(id) {
      this.settingsParams.category_id = id;
    };

    this.setPlaylistId = function(id) {
      this.settingsParams.playlist_id = id;
    };

    /**
     * Set the Playlist IDs of the currently selected Nested Category
     *
     * @param {Array} the IDs of the currently selected Playlist
     */
    this.setPlaylistIds = function(ids) {
      this.settingsParams.playlist_ids = ids;
    };

    /***************************
     *
     * Utilility Methods
     *
     ***************************/
    /**
     * Sort the data array alphabetically
     * This method is just a simple sorting example - but the
     * data can be sorted in any way that is optimal for your application
     */
    this.sortAlphabetically = function(arr) {
      arr.sort();
    };

    /**
     * Convert unix timestamp to date
     * @param {Number} d unix timestamp
     * @return {Date}
     */
    this.unixTimestampToDate = function(d) {

      var unixTimestamp = new Date(d * 1000);

      var year = unixTimestamp.getFullYear();
      var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var month = months[unixTimestamp.getMonth()];
      var date = unixTimestamp.getDate();
      var hour = unixTimestamp.getHours();
      var minute = unixTimestamp.getMinutes();
      var second = unixTimestamp.getSeconds();

      return date + ',' + month + ' ' + year + ' ' + hour + ':' + minute + ':' + second;
    };

    /***************************
     *
     * Category Methods
     *
     ***************************/
    /**
     * Hang onto the index of the currently selected category
     * @param {Number} index the index into the categories array
     */
    this.setCurrentCategory = function(index) {
      this.currentCategory = index;
    };

    /***************************
     *
     * Content Item Methods
     *
     ***************************/

    /**
     * Get category titles + playlist title
     */
    this.getCategoryItems = function(callback) {
      callback(this.categoryData);
    };

    /**
     * Get and return data for a selected category
     * @param {Function} categoryCallback method to call with returned requested data
     */
    this.getCategoryData = function(categoryCallback) {
      this.currData = [];
      var categoryTitle = encodeURIComponent(this.categoryTitle);
      var categoryValue = encodeURIComponent(this.categoryData[this.currentCategory]);
      //  we want to push all the videos with this category value into this.currData()

      var category_url = null;
      if (this.settingsParams.category_id) {
        category_url = this.settingsParams.endpoint + "videos/?app_key=" + this.settingsParams.app_key + "&category[" + categoryTitle + "]=" + categoryValue + "&per_page=" + this.settingsParams.per_page + "&dpt=true&sort=episode&order=asc";
      } else {
        category_url = this.settingsParams.endpoint + "videos/?app_key=" + this.settingsParams.app_key + "&per_page=25&dpt=true&sort=created_at&order=asc";
      }

      $.ajax({
        url: category_url,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: false
      }).fail(function(msg) {
        console.log(msg);
      }).done(function(msg) {
        this.currData = this.formatVideos(msg);
      }).always(function() {
        categoryCallback(this.currData);
      });

    };

    /**
     * Get data for a selected playlist
     * 
     * @param {function} the callback function
     */
    this.getPlaylistData = function(categoryCallback) {
      this.currData = [];
      var _url = this.settingsParams.endpoint;
      var _playlist_id = (this.settingsParams.playlists_only) ? this.categoryData[this.currentCategory].id : this.settingsParams.playlist_id;
      var _data = {
        'app_key'  : this.settingsParams.app_key,
        'per_page' : this.settingsParams.per_page,
        'dpt'      : true
      }
      
      if (this.settingsParams.playlists_only || this.settingsParams.playlist_id) {
        _url += 'playlists/' + _playlist_id + '/videos/';
      }
      else {
        _url += 'videos/';
        _data['sort'] = 'created_at';
        _data['order'] = 'desc';
      }

      $.ajax({
        url: _url,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        data: _data,
        success: function() {
          var contentData = arguments[0];
          this.currData = this.formatVideos(contentData);
        },
        error: function() {
          console.log(arguments);
          alert("There was an error configuring your Fire TV App. Please try again.");
        },
        complete: function() {
          categoryCallback(this.currData);
        }
      });
    };

    /**
     * Get Entitlement video data recursively
     * @param {object}   the entitlement data
     * @param {function} the callback function
     * @param {integer}  the starting index 
     * @param {array}    the retrieved video data
     */
    this.getEntitlementData = function(jsonData, callback, counter, videoData) {
      this.currData = [];
      var j = counter || 0;
      var videoData = videoData || [];
      var video_id = (jsonData.response) ? jsonData.response[j].video_id : null;

      if (video_id) {
        // For each video, get video details and save them
        $.ajax({
          url: this.settingsParams.endpoint + "videos/" + video_id,
          type: 'GET',
          crossDomain: true,
          dataType: 'json',
          context: this,
          cache: false,
          data: {
            "app_key" : this.settingsParams.app_key,
            "dpt" : true
          },
          success: function(result) {
            videoData.push(result.response);

            if (j < (jsonData.response.length - 1)) {
              j++;

              return this.getEntitlementData(jsonData, callback, j, videoData);
            }

            this.currData = this.formatVideos(videoData);

            return callback(this.currData);
          },
          error: function(xhr) {
            console.log('error', xhr);
          }
        });
      }
      else {
        return callback(this.currData);
      }
    };

    //  Format Zype videos
    this.formatVideos = function(jsonData) {
      var videos = jsonData.response || jsonData;

      // set up the formatted video array
      // do we want to do it this way, or do we just want to change the variables that are being used down the road (def want to change the variables down the road)
      var formattedVideos = [];

      for (var i = 0; i < videos.length; i++) {
        var args = {
          "id": videos[i]._id,
          "title": videos[i].title,
          "pubDate": videos[i].published_at,
          "thumbURL": this.parse_thumbnails(videos[i]),
          "imgURL": this.parse_thumbnails(videos[i]),
          // parse videoURL at playtime
          "description": videos[i].description,
          "seconds": videos[i].duration,
          "subscription_required": videos[i].subscription_required,
          "rental_required": videos[i].rental_required,
          "purchase_required": videos[i].purchase_required,
          "pass_required": videos[i].pass_required
        };

        var video = new Video(args);
        formattedVideos.push(video);
      }
      // return the formatted video array
      return formattedVideos;
    };

    this.parse_thumbnails = function(video) {
      // Custom Image
      if (video.images && this.settingsParams.related_images) {
        for (var i = 0; i < video.images.length; i++) {
          if (video.images[i].title && (video.images[i].title.toLowerCase() === this.settingsParams.related_images_title)) {
            return utils.makeSSL(video.images[i].url);
          }
        }
      }
      // Standard Thumbnails
      else if (video.thumbnails.length > 0) {
        for (var i = 0; i < video.thumbnails.length; i++) {
          if (video.thumbnails[i].width > 400) {
            return utils.makeSSL(video.thumbnails[i].url);
          }
        }
      }
      // Default Image
      return this.settingsParams.default_image_url;
    };

    /**
     * Get and return data for a search term
     * @param {string} term to search for
     * @param {Function} searchCallback method to call with returned requested data
     */
    this.getDataFromSearch = function(searchTerm, searchCallback) {
      this.currData = [];

      $.ajax({
        url: this.settingsParams.endpoint + "videos/?app_key=" + this.settingsParams.app_key + "&per_page=100&dpt=true&sort=created_at&order=asc&q=" + searchTerm,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        context: this,
        cache: true,
        success: function() {
          var contentData = arguments[0];
          this.currData = this.formatVideos(contentData);
        },
        error: function() {
          console.log(arguments);
          alert("There was an error configuring your Fire TV App. Please exit.");
          app.exit();
        },
        complete: function() {
          searchCallback(this.currData);
        }
      });
    };

    /**
     * Store the refrerence to the currently selected content item
     * @param {Number} index the index of the selected item
     */
    this.setCurrentItem = function(index) {
      this.currentItem = index;
      this.currentItemData = this.currData[index];
    };

  };

  exports.JSONMediaModel = JSONMediaModel;

})(window);
