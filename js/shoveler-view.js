/* Shoveler View
 *
 * Handles the "shoveler" which is a right-to-left carousel view with endpoints on both sides
 *
 */

(function(exports) {
  "use strict";

  var SHOVELER_ROW_ITEM_SELECTED = "shoveler-rowitem-selected";

  /**
   * @class ShovelerView
   * @description The shoveler view object, this handles everything about the shoveler.
   */
  var ShovelerView = function() {
    // mixin inheritance, initialize this as an event handler for these events:
    Events.call(this, ['loadComplete', 'exit', 'bounce', 'startScroll', 'indexChange', 'stopScroll', 'select', 'loadNext']);

    var _this = this;

    // global variables
    this.currSelection       = 0;
    this.elementWidths       = [];
    this.isScrolling         = false;
    this.currScrollDirection = null;
    this.loadingImages       = 0;
    this.$parentEle          = null;
    this.$el                 = null;
    this.elHeight            = null;
    this.$rowElements        = null;
    this.rowsData            = null;

    // constants
    this.MARGIN_WIDTH   = 40;
    this.STARTING_SIZE  = 216;
    this.transformStyle = utils.vendorPrefix('Transform');

    /**
     * Removes the main content view dom
     */
    this.remove = function() {
      // remove this element from the dom
      this.$el.remove();
    };

    /**
     * Hides the shoveler view
     */
    this.hide = function() {
      this.$el.hide();
    };

    /**
     * Shows the shoveler view
     */
    this.show = function() {
      this.$el.show();
    };

    /**
     * Touch handler for content items
     * @param {Event} e
     */
    this.handleContentItemSelection = function(e) {
      var targetIndex = $(e.target).parent().index();

      if (targetIndex === this.currSelection) {
        this.trigger('select', this.currSelection);
      } else {
        //set current selected item
        this.setSelectedElement(targetIndex);

        this.transitionRow();

        this.trigger("stopScroll", this.currSelection);
      }
    }.bind(this);

    /**
     * Creates the shoveler view and appends it to the one-d-view shoveler container
     * 
     * @param {Element} el  one-d-view container
     * @param {Object}  row the the data for the row
     */
    this.render = function(el, row) {
      // Save references
      this.$parentEle = el; // @NOTE currently unused
      this.rowsData   = row;

      // Build the main content items
      var wrapper = utils.buildTemplate($("#shoveler-template"));
      var items   = utils.buildTemplate($("#shoveler-items-template"), {
        items: row
      });

      // Append `wrapper`
      el.append(wrapper);

      // Save reference to newly appended wrapper
      this.$el = el.children().last();
      this.elHeight = this.$el.height();

      // Append `items` to wrapper
      this.$el.append(items);

      // Hide the element until we are done with layout
      this.$el.css('opacity', 0);

      // Save reference to children
      this.$rowElements = this.$el.children();

      // Gather widths of all the row elements
      this.initialLayout();

      // Register touch handlers for items
      touches.registerTouchHandler("shoveler-full-img", this.handleContentItemSelection);
    };

    this.update = function(row) {
      // Build the main content items
      var items = utils.buildTemplate($("#shoveler-items-template"), {
        items: row
      });

      // Append `items` to wrapper
      this.$el.append(items);

      // Save reference to children
      this.$rowElements = this.$el.children();

      // Gather widths of all the row elements
      this.initialLayout();
    };

    /**
     * Performs the initial layout of the elements of the row
     *
     * For videos with width and height data, the imagesLoaded callback is bypassed
     */
    this.initialLayout = function() {
      // compute all widths
      this.transformLimit = this.$el.width() + 300;
      this.limitTransforms = false;

      // set a callback to make sure all images are loaded
      var imagesLoaded = function(elt, currImage, done) {
        if (currImage) {
          currImage.on("load error", function() {
            elt.children("img.shoveler-full-img")[0].style.visibility = "visible";
            _this.relayoutOnLoadedImages(currImage, done);
          });
        }
        else {
          elt.children("img.shoveler-full-img")[0].style.visibility = "visible";
          _this.relayoutOnLoadedImages(null, done);
        }
      };

      for (var i = 0; i < this.$rowElements.length; i++) {
        var $currElt   = $(this.$rowElements[i]);
        var $currImage = $currElt.children("img.shoveler-full-img");
        var o_width    = this.rowsData[i].imgWidth;
        var o_height   = this.rowsData[i].imgHeight;
        var done       = (i === this.$rowElements.length - 1) ? true : false;

        // if $currImage doesn't already exist, create it
        if ($currImage.length === 0) {
          var id  = this.rowsData[i].id;
          var url = this.rowsData[i].imgURL || './assets/default-image.png';
          
          // create and prepend the <img>
          $currElt.prepend('<img id="image-' + id + '" class="shoveler-full-img" src="' + url + '" style="visibility:hidden;"/>');

          // set $currImage
          $currImage = $currElt.children("img.shoveler-full-img");
        }

        // Calculate scaled width from dimension data, else load the image
        if (o_width && o_height) {
          var width;

          if (o_height > this.elHeight) {
            width = o_width / (o_height / this.elHeight);
          }
          else {
            width = (this.elHeight / o_height) * o_width;
          }

          // Set the scaled width
          $currElt.css('width', width + 'px');

          imagesLoaded($currElt, null, done);
        }
        // Load the image and calculate width
        else {
          imagesLoaded($currElt, $currImage, done);
          this.loadingImages++;
        }
      }
    };

    /**
     * Callback Function to reposition the images from the placeholder positions once they load
     *
     * @param {Object}  currImage the current image
     * @param {Boolean} done      true if current row items are finished looping
     *
     */
    this.relayoutOnLoadedImages = function(currImage, done) {
      if (currImage && --this.loadingImages === 0) {
        this.layoutElements();
      }
      // if image loop complete and custom images are done loading
      else if (done && this.loadingImages === 0) {
        this.layoutElements();
      }
    };

    /**
     * Performs secondary layout of the elements of the row, after images load for the first time
     */
    this.layoutElements = function() {
      console.log('layoutElements');
      for (var i = 0; i < this.$rowElements.length; i++) {
        var $currElt = $(this.$rowElements[i]);
        this.elementWidths[i] = $currElt.width();
      }

      this.setTransforms(0);
      this.shrinkSelected();

      window.setTimeout(function() {
        this.$rowElements.css("transition", "");
        this.limitTransforms = true;
        this.finalizeRender();
      }.bind(this), 500);
    };

    /**
     * Images are loaded and positioned so display the shoveler
     * and send our 'loadComplete' event to stop the spinner
     */
    this.finalizeRender = function() {
      this.$el.css('opacity', '');
      this.trigger('loadComplete');
    };

    /**
     * Move the shoveler in either left or right direction
     * @param {Number} dir the direction of the move
     */
    this.shovelMove = function(dir) {
      $(this.$rowElements[this.currSelection]).removeClass(SHOVELER_ROW_ITEM_SELECTED);
      this.trigger("startScroll", dir);
      this.selectRowElement(dir);
    }.bind(this);

    /**
     * Handles controls: LEFT:  Move to main content if first element, otherwise select previous element
     *                   RIGHT: Select next element
     *                   UP:    Return to main content view
     *                   DOWN:  Nothing at the moment
     *                   BACK:  Back to leftNav State
     * @param {event} the keydown event
     */
    this.handleControls = function(e) {
      if (e.type === 'touch') {
        //do nothing for now
      } else if (e.type === 'swipe') {
        if (e.keyCode === buttons.RIGHT) {
          if (this.currSelection !== 0) {
            this.shovelMove(-1);
            //stop scroll immediately - swipe only increments 1 right now
            this.trigger("stopScroll", this.currSelection);
          } else {
            this.trigger('bounce', e.keyCode);
          }
        } else if (e.keyCode === buttons.LEFT) {
          if (this.currSelection < this.rowsData.length) {
            this.shovelMove(1);
            //stop scroll immediately - swipe only increments 1 right now
            this.trigger("stopScroll", this.currSelection);
          } else {
            this.trigger('bounce', e.keyCode);
          }
        }
      } else if (e.type === 'buttonpress') {
        switch (e.keyCode) {
          case buttons.SELECT:
          case buttons.PLAY_PAUSE:
            this.trigger('select', this.currSelection);
            break;

          case buttons.BACK:
            this.trigger("exit");
            break;

          case buttons.UP:
          case buttons.DOWN:
            this.trigger("bounce");
            break;

          case buttons.LEFT:
            if (this.currSelection !== 0) {
              this.shovelMove(-1);
            } else {
              this.trigger('bounce', e.keyCode);
            }

            break;

          case buttons.RIGHT:
            if (this.currSelection < this.rowsData.length) {
              this.shovelMove(1);
              if (this.currSelection === this.rowsData.length - 2) {
                this.trigger('loadNext');
                console.log('loadNext triggered');
              }
            } else {
              this.trigger('bounce', e.keyCode);
            }
            break;
        }
      } else if (e.type === 'buttonrepeat') {
        switch (e.keyCode) {
          case buttons.LEFT:
            this.selectRowElement(-1);
            break;

          case buttons.RIGHT:
            this.selectRowElement(1);
            break;
        }
      } else if (e.type === 'buttonrelease') {
        switch (e.keyCode) {
          case buttons.LEFT:
          case buttons.RIGHT:
            this.trigger("stopScroll", this.currSelection);
            // add the shiner to the new element
            $(this.$rowElements[this.currSelection]).addClass(SHOVELER_ROW_ITEM_SELECTED);

            break;
        }
      }
    }.bind(this);

    /**
     * Moves the row element to the right or left based on the direction given to it
     * @param {number} the direction to scroll, 1 is  right, -1 is left
     */
    this.selectRowElement = function(direction) {

      if ((direction > 0 && (this.$rowElements.length - 1) === this.currSelection) ||
        (direction < 0 && this.currSelection === 0)) {
        return false;
      }

      this.currSelection += direction;

      this.transitionRow();

      return true;
    }.bind(this);

    /**
     * This will manage the transition of the newly
     * selected item to the currently selected item
     */
    this.transitionRow = function() {
      window.requestAnimationFrame(function() {
        this.setTransforms(this.currSelection);
      }.bind(this));

      this.trigger('indexChange', this.currSelection);
    }.bind(this);

    /**
     * Explicitly set the selected element using the index
     * @param {Number} index the index of the content element
     */
    this.setSelectedElement = function(index) {
      this.currSelection = index;
    }.bind(this);

    /**
     * Set properties for the currently selected element
     * 
     * @param {Element} selectedEle they currently selected element
     */
    this.manageSelectedElement = function(selectedEle) {
      selectedEle.style[this.transformStyle] = "translate3d(0, 0, 0) scale(1.05)";
      selectedEle.style.opacity = "0.99";
    };

    /**
     * Take down the opacity of the selected while in another view
     */
    this.fadeSelected = function() {
      this.$rowElements[this.currSelection].style.opacity = "0.5";
    };

    /**
     * Set back to full opacity when in the shoveler/oneD view
     */
    this.unfadeSelected = function() {
      this.$rowElements[this.currSelection].style.opacity = "0.99";
    };

    /**
     * Shrink all the elements to the same size while the shoveler is not in focus
     */
    this.shrinkSelected = function() {
      this.setRightItemPositions(this.currSelection, 0 - this.MARGIN_WIDTH);
      this.setLeftItemPositions(this.currSelection - 1, 0);
    };

    /**
     * Set the positions of all elements to the right of the selected item
     * 
     * @param {Number} start the starting index
     * @param {Number} currX the current X position
     */
    this.setRightItemPositions = function(start, currX) {
      for (var i = start; i < this.$rowElements.length; i++) {
        if (this.elementWidths[i] > 0) {
          this.$rowElements[i].style[this.transformStyle] = "translate3d(" + ( currX + this.MARGIN_WIDTH ) + "px,0,0px)";
          this.$rowElements[i].style.opacity = "0.5";
        } else {
          //keep element offscreen if we have no width yet
          this.$rowElements[i].style[this.transformStyle] = "translate3d(" + this.transformLimit + " +px,0,0px)";
        }

        if (currX > this.transformLimit) {
          if (this.limitTransforms) {
            break;
          }
        } else {
          currX += Math.round(this.elementWidths[i] + this.MARGIN_WIDTH);
        }
      }
    };

    /**
     * Set the positions of all elements to the left of the selected item
     * 
     * @param {Number} start the starting index
     * @param {Number} currX the current X position
     */
    this.setLeftItemPositions = function(start, currX) {
      for (var i = start; i >= 0; i--) {
        var currPosition = (currX - this.elementWidths[i] - this.MARGIN_WIDTH );
        var itemTrans = "translate3d(" + currPosition + "px,0, 0px)";

        if (this.elementWidths[i] > 0) {
          this.$rowElements[i].style[this.transformStyle] = itemTrans;
          this.$rowElements[i].style.opacity = "0.5";
        } else {
          //keep element offscreen if we have no width yet
          this.$rowElements[i].style[this.transformStyle] = "translate3d(" + (-this.transformLimit) + "px,0,0px)";
          this.$rowElements[i].style.display = "none";
        }

        if (currX < -this.transformLimit + 1000) {
          if (this.limitTransforms) {
            break;
          }
        } else {
          currX -= Math.round(this.elementWidths[i] + this.MARGIN_WIDTH);
        }
      }
    };

    /**
     * This is the method that transitions the element in the row
     * 
     * @param {Number} selected the index of the currently selected item
     */
    this.setTransforms = function(selected) {
      console.log('setTransforms');
      var currX = 0;
      // selected = selected || this.currSelection;
      var selected = selected || this.currSelection;

      // set selected element properties
      this.manageSelectedElement(this.$rowElements[selected]);

      this.setLeftItemPositions(selected - 1, currX);

      currX = Math.round(this.elementWidths[selected]);

      this.setRightItemPositions(selected + 1, currX);
    }.bind(this);
  };

  exports.ShovelerView = ShovelerView;
}(window));
