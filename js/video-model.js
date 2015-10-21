/* Model
 *
 * Model for Video
 */

var Video = function(args) {
  this.id = args.id;
  this.title = args.title;
  this.pubDate = args.pubDate;
  this.thumbURL = args.thumbURL;
  this.imgURL = args.imgURL;
  this.description = args.description;
  this.seconds = args.seconds;
  this.subscription_required = args.subscription_required;
  this.rental_required = args.rental_required;
  this.purchase_required = args.purchase_required;
  this.pass_required = args.pass_required;
};

Video.prototype = {
    constructor: Video,
    hasPaywall: function ()  {
      return this.subscription_required || this.rental_required || this.purchase_required || this.pass_required;
    }
};