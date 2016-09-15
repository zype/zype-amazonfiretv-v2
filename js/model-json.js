/* Model
 *
 * Model for JSON data
 */

(function(exports) {
  "use strict";

  // the model for the Media Sample Data
  // {Object} appSettings are the user-defined settings from the index page
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
        that.loadCategoryData(dataLoadedCallback);
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
      var retry = 2;

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
      var video_id  = zobjectData[j].id;
      var title     = zobjectData[j].title;
      var desc      = zobjectData[j].desc;
      var thumbnail = zobjectData[j].thumbnail;

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
        error: function() {
          console.log('loadVideoDetails.error');
          if (fail < retry) {
            fail++;
            return this.loadSliderVideoDetails(zobjectData, callback, j, fail);
          }
          alert("There was an error configuring your Fire TV App. Please exit.");
          return app.exit();
        }
      });
    };

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
          this.loadPlaylistData(categoryDataLoadedCallback);
        }
      });
    };

    /**
     * Handles requests that contain json data
     * @param {Object} jsonData data returned from request
     */
    this.getCategoryRowValues = function(jsonData) {
      this.categoryData = jsonData.response.values;
      console.log('this.categoryData', this.categoryData);
      this.categoryTitle = jsonData.response.title;
    }.bind(this);

    /**
     * Return the category items for the left-nav view
     */
    this.loadPlaylistData = function(categoryDataLoadedCallback) {
      console.log("load.playlist.data");
      if (this.settingsParams.playlist_id) {
        $.ajax({
          url: this.settingsParams.endpoint + "playlists/" + this.settingsParams.playlist_id + "/?app_key=" + this.settingsParams.app_key,
          type: 'GET',
          crossDomain: true,
          dataType: 'json',
          context: this,
          cache: true,
          success: function() {
            var contentData = arguments[0];
            this.getPlaylistRowValue(contentData);
          },
          error: function() {
            var contentData = {
              response: {
                title: 'New Releases'
              }
            };
            this.getPlaylistRowValue(contentData);
          },
          complete: function() {
            this.loadZObjectData(categoryDataLoadedCallback);
          }
        });
      }
    };

    this.getPlaylistRowValue = function(jsonData) {
      var playlistTitle = jsonData.response.title;
      this.categoryData.unshift(playlistTitle);
    }.bind(this);

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
        var args = {
          id: data[i]._id,
          title: data[i].title,
          playlist_id: data[i].playlist_id,
          category_id: data[i].category_id,
          description: data[i].description
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

    this.getPlaylistData = function(categoryCallback) {
      this.currData = [];
      var categoryValue = encodeURIComponent(this.categoryData[this.currentCategory]);
      //  we want to push all the videos with this category value into this.currData()

      var playlist_url = null;
      if (this.settingsParams.playlist_id) {
        playlist_url = this.settingsParams.endpoint + "playlists/" + this.settingsParams.playlist_id + "/videos/?app_key=" + this.settingsParams.app_key + "&per_page=" + this.settingsParams.per_page;
      } else {
        playlist_url = this.settingsParams.endpoint + "videos/?app_key=" + this.settingsParams.app_key + "&per_page=10&dpt=true&sort=created_at&order=desc";
      }

      $.ajax({
        url: playlist_url,
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
          categoryCallback(this.currData);
        }
      });
    };

    //  Format Zype videos
    this.formatVideos = function(jsonData) {
      var videos = jsonData.response;
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
      if (video.images && this.settingsParams.related_images) {
        return utils.makeSSL(video.images[0].url);
      } else {
        for (var i = 0; i < video.thumbnails.length; i++) {
          if (video.thumbnails[i].width > 400) {
            return utils.makeSSL(video.thumbnails[i].url);
          }
        }
      }
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
