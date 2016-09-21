/* Model
 *
 * Model for Category
 */

var Channel = function(args) {
  this.id = args.id;
  this.title = args.title || "";
  this.imgURL = args.imgUrl || "";
  this.description = args.description || "";
  this.playlist_id = args.playlist_id || null;
  this.category_id = args.category_id || null;
  this.playlist_ids = args.playlist_ids || [];
};

Channel.prototype = {
  constructor: Channel
};
