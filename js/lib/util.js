/* Utilities
 *
 * App utility methods
 *
 */

(function(exports) {
  "use strict";

  var Utils = function() {
    // make it a singleton
    if (exports.utils) {
      return utils;
    }

    this.prefix = '';

    /**
     * @function makeSSL
     * @param {url} incoming url
     * @description Makes a url https.
     */
    this.makeSSL = function(url) {
      if (url) {
        var uri = new URI(url);
        uri.protocol("https");
        return uri.href();
      }
    };

    /**
     * @function buildTemplate
     * @param {el} the handlebars template element
     * @param {context} the context data for filling out the template
     * @description Grabs the handlebars template, runs the data through it, and appends the final html to the homeview.
     */
    this.buildTemplate = function(el, context) {
      var source = el.html();
      var template = Handlebars.compile(source);
      var html = template(context);
      return html;
    };

    /**
     * @function firstPageItem
     * @description Handlebars helper for only displaying items that fit in the main content view, this is decided by
     * the SHOWN_ROW_ITEM_LENGTH constant, this constant would change depending on the width of your items, this allows
     * handlebars to display items that are on the first page, and not display others.
     */
    Handlebars.registerHelper('firstPageItem', function(value, options) {
      if (value >= 6) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    /**
     * @function vendorPrefix
     * @description apply vendor prefix (indiscriminately) to passed style
     */
    this.vendorPrefix = function(prop) {
      return this.prefix + prop;
    };

    // find the current vendor prefix
    var regex = /^(Moz|Webkit|ms)(?=[A-Z])/;
    var someScript = document.getElementsByTagName('script')[0];

    for (var prop in someScript.style) {
      if (regex.test(prop)) {
        this.prefix = prop.match(regex)[0];
        break;
      }
    }

    if (!this.prefix && 'WebkitOpacity' in someScript.style) {
      this.prefix = 'Webkit';
    }
    if (!this.prefix) {
      // unprefixed, go figure
      this.prefix = '';
    }

    // Convert seconds to HH:MM:SS
    this.parseTime = function(totalSec) {
      var hours = parseInt(totalSec / 3600) % 24;
      var minutes = parseInt(totalSec / 60) % 60;
      var seconds = totalSec % 60;

      return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
    };

  };

  exports.Utils = Utils;
  exports.utils = new Utils();
}(window));
